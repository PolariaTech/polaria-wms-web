import { PDFDocument } from "pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PAGINAS_HTML, pdfDeHtml, sanitizarHtmlOc, type LienzoRenderizado } from "./html-a-pdf";

// `addImage` es de cada instancia de jsPDF, no del prototipo: se sustituye la clase por una que
// registra las llamadas, así no hace falta una imagen real para probar cómo se reparte en páginas.
const { llamadasAddImage } = vi.hoisted(() => ({ llamadasAddImage: [] as unknown[][] }));
vi.mock("jspdf", async (importarOriginal) => {
  const original = await importarOriginal<typeof import("jspdf")>();
  class JsPdfSinImagenes extends original.jsPDF {
    constructor(...args: ConstructorParameters<typeof original.jsPDF>) {
      super(...args);
      (this as unknown as { addImage: (...a: unknown[]) => unknown }).addImage = (...a: unknown[]) => {
        llamadasAddImage.push(a);
        return this;
      };
    }
  }
  return { ...original, jsPDF: JsPdfSinImagenes };
});

const lienzo = (width: number, height: number): LienzoRenderizado => ({
  width,
  height,
  toDataURL: () => "data:image/jpeg;base64,AAAA",
});

beforeEach(() => {
  llamadasAddImage.length = 0;
});

describe("sanitizarHtmlOc", () => {
  const limpio = (html: string) => sanitizarHtmlOc(html);

  it("conserva el texto, las tablas y los estilos propios", () => {
    const html = limpio(
      '<html><head><title>Purchase order: 28593</title></head><body><table style="color:red"><tr><td>ORDEN DE COMPRA</td><td>000028593</td></tr></table></body></html>',
    );

    expect(html).toContain("ORDEN DE COMPRA");
    expect(html).toContain("000028593");
    expect(html).toContain("<table");
    expect(html).toContain("color:red");
  });

  it("quita scripts, marcos, formularios y todo lo que pueda cargar o enviar algo", () => {
    const html = limpio(
      '<body><script>alert(1)</script><iframe src="https://x"></iframe><object data="x"></object><form action="https://x"><input name="a"><button>ok</button></form><p>texto</p></body>',
    );

    for (const prohibido of ["<script", "<iframe", "<object", "<form", "<input", "<button"]) {
      expect(html).not.toContain(prohibido);
    }
    expect(html).toContain("texto");
  });

  it("quita los manejadores de eventos y los enlaces a la red, pero deja las imágenes incrustadas", () => {
    const html = limpio(
      '<body onload="x()"><a href="https://malo.example" onclick="y()">enlace</a><img src="https://rastreo.example/p.gif"><img src="data:image/png;base64,AAAA" alt="logo"></body>',
    );

    expect(html).not.toContain("onload");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("malo.example");
    expect(html).not.toContain("rastreo.example");
    expect(html).toContain("data:image/png;base64,AAAA");
    expect(html).toContain("enlace");
  });

  it("quita las hojas de estilo externas y las referencias de red dentro del CSS", () => {
    const html = limpio(
      '<head><link rel="stylesheet" href="https://cdn.example/a.css"><style>@import url(https://x/y.css); td{background:url(https://x/fondo.png) no-repeat;color:blue}</style></head><body><td style="background:url(http://x/z.png)">a</td></body>',
    );

    expect(html).not.toContain("cdn.example");
    expect(html).not.toContain("@import");
    expect(html).not.toContain("https://x");
    expect(html).not.toContain("http://x");
    expect(html).toContain("color:blue");
  });

  it("agrega una política que impide cargar recursos aunque quedara alguno", () => {
    const html = limpio("<body>hola</body>");

    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('http-equiv="Content-Security-Policy"');
    expect(html).toContain("default-src 'none'");
  });

  it("quita una política propia del documento y deja solo la suya", () => {
    const html = limpio('<head><meta http-equiv="Content-Security-Policy" content="default-src *"></head><body>x</body>');

    expect(html).not.toContain("default-src *");
    expect(html.match(/Content-Security-Policy/g)).toHaveLength(1);
  });
});

describe("pdfDeHtml", () => {
  it("pasa el HTML ya limpio al renderizador y devuelve un PDF válido", async () => {
    const renderizar = vi.fn().mockResolvedValue(lienzo(816, 1000));

    const pdf = await pdfDeHtml('<body onclick="x()">hola</body>', "po.html", renderizar);

    expect(renderizar.mock.calls[0]![0]).not.toContain("onclick");
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
  });

  it("reparte la imagen en tantas páginas carta como haga falta", async () => {
    // Ancho 816 px = una carta; alto 2400 px ≈ 821 mm ≈ 3 páginas de 279,4 mm.
    const pdf = await pdfDeHtml("<body>largo</body>", "po.html", async () => lienzo(816, 2400));

    expect((await PDFDocument.load(pdf)).getPageCount()).toBe(3);
    expect(llamadasAddImage).toHaveLength(3);
    // Cada página sube la imagen lo que ya mostró la anterior.
    expect(llamadasAddImage.map((c) => Math.round(Number(c[3])))).toEqual([0, -279, -559]);
  });

  it("una OC corta cabe en una sola página", async () => {
    const pdf = await pdfDeHtml("<body>corto</body>", "po.html", async () => lienzo(816, 300));

    expect((await PDFDocument.load(pdf)).getPageCount()).toBe(1);
  });

  it("un HTML larguísimo se corta en el tope de páginas", async () => {
    const pdf = await pdfDeHtml("<body>x</body>", "po.html", async () => lienzo(816, 90_000));

    expect((await PDFDocument.load(pdf)).getPageCount()).toBe(MAX_PAGINAS_HTML);
  });

  it("si queda en blanco falla con un mensaje que nombra el archivo", async () => {
    await expect(pdfDeHtml("<body></body>", "vacio.html", async () => lienzo(0, 0))).rejects.toThrow(
      "vacio.html quedó en blanco al convertirlo.",
    );
  });

  it("si el renderizador falla, el error llega tal cual", async () => {
    await expect(
      pdfDeHtml("<body>x</body>", "po.html", async () => {
        throw new Error("sin memoria");
      }),
    ).rejects.toThrow("sin memoria");
  });
});
