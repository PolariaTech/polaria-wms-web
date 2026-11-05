import { PDFDocument } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";
import type { DocumentoOc, OcDeOv } from "./oc-documentos";
import {
  bajarArchivo,
  MAX_PAGINAS_POR_DOCUMENTO,
  prepararOcDeOv,
  type DependenciasOc,
} from "./preparar-oc";

async function pdfDe(paginas: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < paginas; i += 1) doc.addPage();
  return doc.save();
}

const aBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const documento = (nombre: string, tipo: DocumentoOc["tipo"]): DocumentoOc => ({
  nombre,
  tipo,
  url: `/api/ov-adjuntos/file?path=${nombre}`,
  bytes: 1000,
});

const oc = (documentos: DocumentoOc[], omitidos: OcDeOv["omitidos"] = []): OcDeOv => ({ documentos, omitidos });

async function dependencias(extra: Partial<DependenciasOc> = {}): Promise<DependenciasOc> {
  const dosPaginas = await pdfDe(2);
  return {
    bajar: vi.fn().mockResolvedValue(aBuffer(await pdfDe(3))),
    pdfDeHtml: vi.fn().mockResolvedValue(dosPaginas),
    pdfDeExcel: vi.fn().mockReturnValue(dosPaginas),
    ...extra,
  };
}

describe("prepararOcDeOv", () => {
  it("un PDF pasa tal cual y cuenta sus páginas", async () => {
    const deps = await dependencias();

    const resultado = await prepararOcDeOv(oc([documento("pedido.pdf", "pdf")]), deps);

    expect(resultado.documentos).toHaveLength(1);
    expect(resultado.documentos[0]).toMatchObject({ nombre: "pedido.pdf", paginas: 3 });
    expect(resultado.paginas).toBe(3);
    expect(resultado.avisos).toEqual([]);
    expect(deps.pdfDeHtml).not.toHaveBeenCalled();
    expect(deps.pdfDeExcel).not.toHaveBeenCalled();
  });

  it("el HTML y el Excel se convierten con su propio convertidor", async () => {
    const deps = await dependencias();
    deps.bajar = vi.fn().mockResolvedValue(new TextEncoder().encode("<body>OC</body>").buffer);

    const resultado = await prepararOcDeOv(oc([documento("po.html", "html"), documento("lista.xlsx", "excel")]), deps);

    expect(deps.pdfDeHtml).toHaveBeenCalledWith("<body>OC</body>", "po.html");
    expect(deps.pdfDeExcel).toHaveBeenCalledTimes(1);
    expect(resultado.documentos.map((d) => d.nombre)).toEqual(["po.html", "lista.xlsx"]);
    expect(resultado.paginas).toBe(4);
  });

  it("conserva el orden de los documentos y suma sus páginas", async () => {
    const deps = await dependencias();

    const resultado = await prepararOcDeOv(oc([documento("b.pdf", "pdf"), documento("a.pdf", "pdf")]), deps);

    expect(resultado.documentos.map((d) => d.nombre)).toEqual(["b.pdf", "a.pdf"]);
    expect(resultado.paginas).toBe(6);
  });

  it("un archivo que no baja no detiene a los demás: se anota con su nombre", async () => {
    const buenos = aBuffer(await pdfDe(1));
    const deps = await dependencias({
      bajar: vi.fn().mockRejectedValueOnce(new Error("el servidor respondió 404")).mockResolvedValue(buenos),
    });

    const resultado = await prepararOcDeOv(oc([documento("falta.pdf", "pdf"), documento("ok.pdf", "pdf")]), deps);

    expect(resultado.documentos.map((d) => d.nombre)).toEqual(["ok.pdf"]);
    expect(resultado.avisos).toEqual(["falta.pdf: el servidor respondió 404."]);
  });

  it("un PDF falso (otra cosa con extensión .pdf) se anota y no entra al paquete", async () => {
    const deps = await dependencias({
      bajar: vi.fn().mockResolvedValue(new TextEncoder().encode("<html>no soy pdf</html>").buffer),
    });

    const resultado = await prepararOcDeOv(oc([documento("raro.pdf", "pdf")]), deps);

    expect(resultado.documentos).toEqual([]);
    expect(resultado.avisos).toEqual(["raro.pdf: no es un PDF válido."]);
  });

  it("un PDF dañado o cifrado que pdf-lib no abre se anota", async () => {
    const roto = new TextEncoder().encode("%PDF-1.4\nesto no es un pdf completo");
    const deps = await dependencias({ bajar: vi.fn().mockResolvedValue(aBuffer(roto)) });

    const resultado = await prepararOcDeOv(oc([documento("roto.pdf", "pdf")]), deps);

    expect(resultado.documentos).toEqual([]);
    expect(resultado.avisos).toHaveLength(1);
    expect(resultado.avisos[0]).toContain("roto.pdf:");
  });

  it("un documento demasiado largo se anota en vez de llenar el paquete", async () => {
    const largo = aBuffer(await pdfDe(MAX_PAGINAS_POR_DOCUMENTO + 1));
    const deps = await dependencias({ bajar: vi.fn().mockResolvedValue(largo) });

    const resultado = await prepararOcDeOv(oc([documento("enorme.pdf", "pdf")]), deps);

    expect(resultado.documentos).toEqual([]);
    expect(resultado.avisos[0]).toContain(`tiene ${MAX_PAGINAS_POR_DOCUMENTO + 1} páginas`);
  });

  it("si falla el convertidor de HTML se anota y sigue con el siguiente", async () => {
    const deps = await dependencias({ pdfDeHtml: vi.fn().mockRejectedValue(new Error("quedó en blanco")) });
    deps.bajar = vi.fn().mockResolvedValue(aBuffer(await pdfDe(1)));

    const resultado = await prepararOcDeOv(oc([documento("po.html", "html"), documento("ok.pdf", "pdf")]), deps);

    expect(resultado.documentos.map((d) => d.nombre)).toEqual(["ok.pdf"]);
    expect(resultado.avisos).toEqual(["po.html: quedó en blanco."]);
  });

  it("lo omitido al elegir los adjuntos (solo nombre, muy grande) también queda anotado", async () => {
    const deps = await dependencias();

    const resultado = await prepararOcDeOv(
      oc([], [
        { nombre: "viejo.pdf", motivo: "sin_archivo" },
        { nombre: "enorme.xlsx", motivo: "muy_grande" },
      ]),
      deps,
    );

    expect(resultado.avisos).toEqual([
      "viejo.pdf: solo quedó el nombre del archivo, no hay de dónde bajarlo.",
      "enorme.xlsx: pesa más de 10 MB.",
    ]);
    expect(deps.bajar).not.toHaveBeenCalled();
  });

  it("una OV sin OC da un resultado vacío", async () => {
    expect(await prepararOcDeOv(oc([]), await dependencias())).toEqual({ documentos: [], paginas: 0, avisos: [] });
  });
});

describe("bajarArchivo", () => {
  it("devuelve el contenido cuando el servidor responde bien", async () => {
    const contenido = new Uint8Array([1, 2, 3]).buffer;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => contenido }));

    expect(await bajarArchivo("/api/ov-adjuntos/file?path=a")).toBe(contenido);
    expect(fetch).toHaveBeenCalledWith("/api/ov-adjuntos/file?path=a", { credentials: "same-origin", cache: "no-store" });
    vi.unstubAllGlobals();
  });

  it("si el servidor responde con error lo dice con el código", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(bajarArchivo("/x")).rejects.toThrow("el servidor respondió 404");
    vi.unstubAllGlobals();
  });
});
