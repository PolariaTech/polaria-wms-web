import { describe, expect, it } from "vitest";
import {
  canPreviewOrigenAdjunto,
  dedupeOrigenAdjuntos,
  labelTipoOrigenAdjunto,
  mergeOrigenAdjuntosWithEmlParts,
  origenAdjuntoDownloadUrl,
  origenAdjuntoViewUrl,
  parseOrigenArchivos,
  resolveAdjuntoContentType,
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

  it("marca PDF, imagen, HTML y EML como previsualizables (REQ-159)", () => {
    expect(
      canPreviewOrigenAdjunto({
        nombre: "x.pdf",
        url: "https://example.com/x.pdf",
        mime: "application/pdf",
      }),
    ).toBe(true);
    expect(
      canPreviewOrigenAdjunto({
        nombre: "po.html",
        path: "cuenta/uuid-po.html",
        mime: "application/octet-stream",
      }),
    ).toBe(true);
    expect(
      canPreviewOrigenAdjunto({
        nombre: "correo.eml",
        path: "cuenta/uuid-correo.eml",
        mime: "application/octet-stream",
      }),
    ).toBe(true);
    expect(
      canPreviewOrigenAdjunto({
        nombre: "doc.docx",
        url: "https://example.com/doc.docx",
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).toBe(false);
    expect(
      canPreviewOrigenAdjunto({
        nombre: "hoja.xlsx",
        path: "cuenta/uuid-hoja.xlsx",
      }),
    ).toBe(false);
  });

  it("fuerza text/html para .html aunque Storage diga octet-stream (REQ-159)", () => {
    expect(
      resolveAdjuntoContentType("PO.html", "application/octet-stream"),
    ).toBe("text/html; charset=utf-8");
    expect(resolveAdjuntoContentType("nota.htm", null)).toBe(
      "text/html; charset=utf-8",
    );
    expect(resolveAdjuntoContentType("a.pdf", "application/octet-stream")).toBe(
      "application/pdf",
    );
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
