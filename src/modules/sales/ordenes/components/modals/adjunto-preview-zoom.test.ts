import { describe, expect, it } from "vitest";
import {
  ADJUNTO_PREVIEW_PDF_ZOOM_FIT,
  ADJUNTO_PREVIEW_ZOOM_DEFAULT,
  ADJUNTO_PREVIEW_ZOOM_MAX,
  ADJUNTO_PREVIEW_ZOOM_MIN,
  clampAdjuntoPreviewZoom,
  htmlFitZoom,
  withBrowserPdfZoom,
} from "./adjunto-preview-zoom";

describe("adjunto-preview-zoom", () => {
  it("REQ-327: zoom Polaria por defecto es 100%", () => {
    expect(ADJUNTO_PREVIEW_ZOOM_DEFAULT).toBe(1);
  });

  it("el PDF abre al ancho del panel y sin la barra nativa", () => {
    expect(ADJUNTO_PREVIEW_PDF_ZOOM_FIT).toBe("page-width");
    expect(withBrowserPdfZoom("blob:http://localhost/abc")).toBe(
      "blob:http://localhost/abc#toolbar=0&navpanes=0&zoom=page-width",
    );
    expect(withBrowserPdfZoom("blob:http://localhost/abc#page=2", 1.25)).toBe(
      "blob:http://localhost/abc#toolbar=0&navpanes=0&zoom=125",
    );
  });

  it("htmlFitZoom solo achica lo que no cabe al ancho", () => {
    expect(htmlFitZoom(0, 400)).toBeNull();
    expect(htmlFitZoom(400, 400)).toBeNull();
    expect(htmlFitZoom(400, 800)).toBe(0.5);
  });
});

describe("clampAdjuntoPreviewZoom", () => {
  it("no baja del mínimo ni pasa del máximo", () => {
    expect(clampAdjuntoPreviewZoom(0.1)).toBe(ADJUNTO_PREVIEW_ZOOM_MIN);
    expect(clampAdjuntoPreviewZoom(9)).toBe(ADJUNTO_PREVIEW_ZOOM_MAX);
  });

  it("redondea a pasos de 0.25", () => {
    expect(clampAdjuntoPreviewZoom(1.12)).toBe(1);
    expect(clampAdjuntoPreviewZoom(1.2)).toBe(1.25);
  });
});
