import { describe, expect, it } from "vitest";
import {
  ADJUNTO_PREVIEW_ZOOM_MAX,
  ADJUNTO_PREVIEW_ZOOM_MIN,
  clampAdjuntoPreviewZoom,
} from "./adjunto-preview-zoom";

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
