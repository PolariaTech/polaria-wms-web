import { describe, expect, it } from "vitest";
import {
  ADJUNTO_PREVIEW_BROWSER_PDF_ZOOM_PCT,
  ADJUNTO_PREVIEW_ZOOM_DEFAULT,
  ADJUNTO_PREVIEW_ZOOM_MAX,
  ADJUNTO_PREVIEW_ZOOM_MIN,
  clampAdjuntoPreviewZoom,
  withBrowserPdfZoom,
} from "./adjunto-preview-zoom";

describe("adjunto-preview-zoom", () => {
  it("REQ-327: zoom Polaria por defecto es 100%", () => {
    expect(ADJUNTO_PREVIEW_ZOOM_DEFAULT).toBe(1);
  });

  it("REQ-327: el PDF del navegador abre al 75%", () => {
    expect(ADJUNTO_PREVIEW_BROWSER_PDF_ZOOM_PCT).toBe(75);
    expect(withBrowserPdfZoom("blob:http://localhost/abc")).toBe(
      "blob:http://localhost/abc#zoom=75",
    );
    expect(withBrowserPdfZoom("blob:http://localhost/abc#page=2")).toBe(
      "blob:http://localhost/abc#zoom=75",
    );
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
