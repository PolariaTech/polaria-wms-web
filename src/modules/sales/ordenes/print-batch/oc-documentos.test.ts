import { describe, expect, it } from "vitest";
import {
  MAX_BYTES_DOCUMENTO_OC,
  MAX_DOCUMENTOS_OC_POR_OV,
  ocDeOv,
} from "./oc-documentos";

function adjunto(nombre: string, mime: string, extra: Record<string, unknown> = {}) {
  return { nombre, mime, path: `cta/${nombre}`, bytes: 1000, resourceType: "storage", ...extra };
}

const json = (...items: Array<Record<string, unknown>>) => JSON.stringify(items);

describe("ocDeOv", () => {
  it("toma los PDF, HTML y Excel y deja fuera el correo, las imágenes y lo demás", () => {
    const oc = ocDeOv(
      json(
        adjunto("correo.eml", "message/rfc822"),
        adjunto("pedido.pdf", "application/pdf"),
        adjunto("PO_486.html", "text/html"),
        adjunto("lista.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        adjunto("viejo.xls", "application/vnd.ms-excel"),
        adjunto("image001.png", "image/png"),
        adjunto("firma.gif", "image/gif"),
        adjunto("nota.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
      ),
    );

    expect(oc.documentos.map((d) => [d.nombre, d.tipo])).toEqual([
      ["pedido.pdf", "pdf"],
      ["PO_486.html", "html"],
      ["lista.xlsx", "excel"],
      ["viejo.xls", "excel"],
    ]);
    expect(oc.omitidos).toEqual([]);
  });

  it("reconoce el tipo por la extensión si el mime viene vacío o genérico", () => {
    const oc = ocDeOv(
      json(
        adjunto("a.PDF", "application/octet-stream"),
        adjunto("b.HTM", ""),
        adjunto("c.XLSM", "application/octet-stream"),
      ),
    );

    expect(oc.documentos.map((d) => d.tipo)).toEqual(["pdf", "html", "excel"]);
  });

  it("cada documento lleva la dirección del proxy para bajarlo con la sesión", () => {
    const [doc] = ocDeOv(json(adjunto("pedido.pdf", "application/pdf"))).documentos;

    expect(doc?.url).toContain("/api/ov-adjuntos/file");
    expect(doc?.url).toContain("disposition=attachment");
    expect(doc?.bytes).toBe(1000);
  });

  it("en una OV vieja, que solo guardó el nombre del archivo, anota que no hay de dónde bajarlo", () => {
    const oc = ocDeOv("pedido.pdf, lista.xlsx, correo.eml, logo.png");

    expect(oc.documentos).toEqual([]);
    expect(oc.omitidos).toEqual([
      { nombre: "pedido.pdf", motivo: "sin_archivo" },
      { nombre: "lista.xlsx", motivo: "sin_archivo" },
    ]);
  });

  it("un adjunto de más de 10 MB no se baja y se anota", () => {
    const oc = ocDeOv(
      json(
        adjunto("enorme.pdf", "application/pdf", { bytes: MAX_BYTES_DOCUMENTO_OC + 1 }),
        adjunto("justo.pdf", "application/pdf", { bytes: MAX_BYTES_DOCUMENTO_OC }),
      ),
    );

    expect(oc.documentos.map((d) => d.nombre)).toEqual(["justo.pdf"]);
    expect(oc.omitidos).toEqual([{ nombre: "enorme.pdf", motivo: "muy_grande" }]);
  });

  it("si el tamaño no viene se intenta bajar igual", () => {
    const oc = ocDeOv(json(adjunto("a.pdf", "application/pdf", { bytes: undefined })));

    expect(oc.documentos).toHaveLength(1);
    expect(oc.documentos[0]?.bytes).toBeNull();
  });

  it("repite el nombre una sola vez y no pasa del tope de documentos por OV", () => {
    const muchos = Array.from({ length: MAX_DOCUMENTOS_OC_POR_OV + 5 }, (_, i) => adjunto(`p${i}.pdf`, "application/pdf"));

    const oc = ocDeOv(json(adjunto("p0.pdf", "application/pdf"), ...muchos));

    expect(oc.documentos).toHaveLength(MAX_DOCUMENTOS_OC_POR_OV);
    expect(oc.documentos.filter((d) => d.nombre === "p0.pdf")).toHaveLength(1);
  });

  it("sin adjuntos, o con un valor roto, no hay OC ni falla", () => {
    for (const valor of [null, undefined, "", "   ", "[no es json"]) {
      expect(ocDeOv(valor)).toEqual({ documentos: [], omitidos: [] });
    }
  });
});
