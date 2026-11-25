import { describe, expect, it } from "vitest";
import type { OrigenAdjunto } from "../../utils/origen/origen-adjuntos";
import { ADJUNTO_PREVIEW_HTML_DOC_STYLE } from "./adjunto-preview-zoom";
import {
  buildAdjuntoHtmlSrcDoc,
  buildAdjuntoZoomStyle,
  esAdjuntoHtmlResponse,
  esAdjuntoImagen,
} from "./OrdenVentaAdjuntoPreviewModal-helpers";

function makeAdjunto(overrides: Partial<OrigenAdjunto>): OrigenAdjunto {
  return {
    nombre: "archivo.pdf",
    tipo: "otro",
    ...overrides,
  };
}

describe("OrdenVentaAdjuntoPreviewModal-helpers", () => {
  it("esAdjuntoImagen detecta imágenes por mime o extensión y excluye PDFs", () => {
    expect(esAdjuntoImagen(makeAdjunto({ nombre: "foto.jpg", mime: "image/jpeg" }))).toBe(true);
    expect(esAdjuntoImagen(makeAdjunto({ nombre: "captura.WEBP" }))).toBe(true);
    expect(esAdjuntoImagen(makeAdjunto({ nombre: "orden.pdf", mime: "image/png" }))).toBe(false);
    expect(esAdjuntoImagen(makeAdjunto({ nombre: "orden.pdf", mime: "application/pdf" }))).toBe(false);
    expect(esAdjuntoImagen(makeAdjunto({ nombre: "correo.html", mime: "text/html" }))).toBe(false);
  });

  it("esAdjuntoHtmlResponse detecta HTML por content-type o nombre de archivo", () => {
    expect(esAdjuntoHtmlResponse("text/html; charset=utf-8", "doc")).toBe(true);
    expect(esAdjuntoHtmlResponse("application/octet-stream", "pedido.HTML")).toBe(true);
    expect(esAdjuntoHtmlResponse("application/octet-stream", "pedido.htm")).toBe(true);
    expect(esAdjuntoHtmlResponse("application/pdf", "pedido.pdf")).toBe(false);
    expect(esAdjuntoHtmlResponse(null, undefined)).toBe(false);
  });

  it("buildAdjuntoHtmlSrcDoc inyecta base y estilo en <head> o envuelve fragmento HTML", () => {
    const withHead = buildAdjuntoHtmlSrcDoc('<html><head lang="es"><title>OC</title></head><body>Hi</body></html>');
    expect(withHead).toContain(`<head lang="es"><base target="_blank"><style>${ADJUNTO_PREVIEW_HTML_DOC_STYLE}</style>`);
    expect(withHead).toContain("<title>OC</title>");

    const fragment = buildAdjuntoHtmlSrcDoc("<table><tr><td>Total</td></tr></table>");
    expect(fragment).toBe(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${ADJUNTO_PREVIEW_HTML_DOC_STYLE}</style></head><body><table><tr><td>Total</td></tr></table></body></html>`,
    );
  });

  it("buildAdjuntoZoomStyle calcula escala y dimensiones inversas", () => {
    expect(buildAdjuntoZoomStyle(0.5)).toEqual({
      transform: "scale(0.5)",
      transformOrigin: "top left",
      width: "200%",
      height: "200%",
      minHeight: "200%",
    });
    expect(buildAdjuntoZoomStyle(1)).toEqual({
      transform: "scale(1)",
      transformOrigin: "top left",
      width: "100%",
      height: "100%",
      minHeight: "100%",
    });
  });
});
