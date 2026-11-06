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

/** Cada recorte queda anotado (`desde-hasta`) en la imagen que se le pasa a `addImage`. */
const lienzo = (width: number, height: number, extra: Partial<LienzoRenderizado> = {}): LienzoRenderizado => ({
  width,
  height,
  toDataURL: () => "data:image/jpeg;base64,AAAA",
  recortar: (desde, hasta) => `data:image/jpeg;base64,${Math.round(desde)}-${Math.round(hasta)}`,
  ...extra,
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

  it("agrega estilos de papel después de los del cliente: un solo filo, aire en las celdas y líneas que se parten", () => {
    const html = limpio("<head><style>td{color:blue}</style></head><body><table border=1><tr><td>a</td></tr></table></body>");

    expect(html).toContain("border-collapse:collapse");
    expect(html).toContain("padding:6px 8px");
    // La fila que cierra el marco lleva más aire abajo.
    expect(html).toContain("tr:last-child>td{padding-bottom:16px}");
    expect(html).toContain("overflow-wrap:anywhere");
    // Van al final del head para ganar sobre lo del cliente.
    expect(html.indexOf("color:blue")).toBeLessThan(html.indexOf("border-collapse:collapse"));
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

  it("reparte la imagen en tantas páginas carta como haga falta, cada una con su tramo y margen", async () => {
    // Ancho 816 px = una carta (3,78 px/mm); cada hoja útil mide 259,4 mm ≈ 980 px: 2400 px son 3 hojas.
    const pdf = await pdfDeHtml("<body>largo</body>", "po.html", async () => lienzo(816, 2400));

    expect((await PDFDocument.load(pdf)).getPageCount()).toBe(3);
    expect(llamadasAddImage).toHaveLength(3);
    // Cada hoja recibe solo su tramo, no la imagen entera desplazada.
    expect(llamadasAddImage.map((c) => String(c[0]).split(",")[1])).toEqual(["0-980", "980-1960", "1960-2400"]);
    // Y se pone bajo un margen de 10 mm, para que el marco no toque el borde del papel.
    expect(llamadasAddImage.map((c) => Number(c[3]))).toEqual([10, 10, 10]);
  });

  it("corta en una franja en blanco y no por la mitad de un renglón", async () => {
    // Lienzo de 1500 px (a 1,5 de escala); la hoja útil mide ≈ 1470 px. Hay texto en todo el
    // lienzo salvo un hueco entre las filas 700 y 760: ahí se corta, no en el límite de la hoja.
    const tinta = Array.from({ length: 1500 }, (_, y) => (y >= 700 && y < 760 ? 0 : 0.3));
    const pdf = await pdfDeHtml("<body>largo</body>", "po.html", async () => lienzo(1224, 1500, { tinta }));

    expect((await PDFDocument.load(pdf)).getPageCount()).toBe(2);
    expect(llamadasAddImage.map((c) => String(c[0]).split(",")[1])).toEqual(["0-747", "747-1500"]);
  });

  it("no pasa del tope de hojas ni deja una hoja más alta que el papel", async () => {
    await pdfDeHtml("<body>x</body>", "po.html", async () => lienzo(816, 90_000));

    expect(llamadasAddImage).toHaveLength(MAX_PAGINAS_HTML);
    for (const llamada of llamadasAddImage) {
      expect(Number(llamada[5])).toBeLessThanOrEqual(259.4 + 0.01);
    }
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
