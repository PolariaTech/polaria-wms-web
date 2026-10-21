import { describe, expect, it } from "vitest";
import {
  canPreviewOrigenAdjunto,
  dedupeOrigenAdjuntos,
  labelTipoOrigenAdjunto,
  mergeOrigenAdjuntosWithEmlParts,
  origenAdjuntoDownloadUrl,
  origenAdjuntoViewUrl,
  parseOrigenArchivos,
  serializeOrigenArchivos,
} from "./origen-adjuntos";

describe("origen-adjuntos", () => {
  it("parsea legado de nombres separados por coma", () => {
    expect(parseOrigenArchivos("a.pdf, b.jpg")).toEqual([
      { nombre: "a.pdf" },
      { nombre: "b.jpg" },
    ]);
  });

  it("parsea y serializa JSON con URL", () => {
    const items = [
      {
        nombre: "pedido.pdf",
        url: "https://res.cloudinary.com/demo/image/upload/v1/pedido.pdf",
        mime: "application/pdf",
        bytes: 1200,
        resourceType: "image" as const,
      },
    ];
    const raw = serializeOrigenArchivos(items);
    expect(raw).toContain("https://res.cloudinary.com");
    expect(parseOrigenArchivos(raw)).toEqual(items);
  });

  it("marca PDF e imagen como previsualizables", () => {
    expect(
      canPreviewOrigenAdjunto({
        nombre: "x.pdf",
        url: "https://example.com/x.pdf",
        mime: "application/pdf",
      }),
    ).toBe(true);
    expect(
      canPreviewOrigenAdjunto({
        nombre: "doc.docx",
        url: "https://example.com/doc.docx",
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).toBe(false);
  });

  it("etiqueta tipos", () => {
    expect(labelTipoOrigenAdjunto({ nombre: "a.pdf" })).toBe("PDF");
    expect(labelTipoOrigenAdjunto({ nombre: "a.xlsx" })).toBe("XLS");
    expect(labelTipoOrigenAdjunto({ nombre: "a.png", mime: "image/png" })).toBe(
      "IMG",
    );
  });

  it("dedupe por nombre y merge con partes del .eml", () => {
    expect(
      dedupeOrigenAdjuntos([
        { nombre: "PO.html", bytes: 11 },
        { nombre: "PO.html", bytes: 11, url: "/api/x" },
        { nombre: "correo.eml" },
      ]),
    ).toEqual([
      { nombre: "PO.html", bytes: 11, url: "/api/x" },
      { nombre: "correo.eml" },
    ]);

    expect(
      mergeOrigenAdjuntosWithEmlParts(
        [
          { nombre: "PO.html", bytes: 11 },
          { nombre: "correo.eml", path: "a/correo.eml" },
        ],
        [{ nombre: "PO.html", bytes: 11, url: "/api/eml-parts/file?i=0" }],
      ),
    ).toEqual([
      { nombre: "PO.html", bytes: 11, url: "/api/eml-parts/file?i=0" },
      { nombre: "correo.eml", path: "a/correo.eml" },
    ]);
  });

  it("usa proxy Storage y bloquea PDF Cloudinary roto", () => {
    const storage = {
      nombre: "pedido.pdf",
      path: "49m04/uuid-pedido.pdf",
      mime: "application/pdf",
    };
    expect(origenAdjuntoViewUrl(storage)).toContain("/api/ov-adjuntos/file");
    expect(origenAdjuntoDownloadUrl(storage)).toContain("disposition=attachment");

    const broken = {
      nombre: "pedido.pdf",
      url: "https://res.cloudinary.com/demo/image/upload/v1/ov/pedido.pdf",
      mime: "application/pdf",
    };
    expect(origenAdjuntoViewUrl(broken)).toBe("");
    expect(origenAdjuntoDownloadUrl(broken)).toBe("");
  });
});
