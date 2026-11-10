export const ADJUNTO_PREVIEW_ZOOM_MIN = 0.5;
export const ADJUNTO_PREVIEW_ZOOM_MAX = 3;
export const ADJUNTO_PREVIEW_ZOOM_STEP = 0.25;
export const ADJUNTO_PREVIEW_ZOOM_DEFAULT = 1;

export function clampAdjuntoPreviewZoom(value: number): number {
  const stepped = Math.round(value / ADJUNTO_PREVIEW_ZOOM_STEP) * ADJUNTO_PREVIEW_ZOOM_STEP;
  return Math.min(
    ADJUNTO_PREVIEW_ZOOM_MAX,
    Math.max(ADJUNTO_PREVIEW_ZOOM_MIN, Math.round(stepped * 100) / 100),
  );
}
