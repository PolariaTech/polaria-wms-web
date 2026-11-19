export const ADJUNTO_PREVIEW_ZOOM_MIN = 0.5;
export const ADJUNTO_PREVIEW_ZOOM_MAX = 3;
export const ADJUNTO_PREVIEW_ZOOM_STEP = 0.25;
/** Zoom de los controles Polaria (+/−). */
export const ADJUNTO_PREVIEW_ZOOM_DEFAULT = 1;

/**
 * Zoom inicial del visor PDF nativo del navegador (Chrome/Edge),
 * independiente del zoom Polaria (REQ-327).
 */
export const ADJUNTO_PREVIEW_BROWSER_PDF_ZOOM_PCT = 75;

/** Estilos inyectados en HTML de OC: fondo legible + escala del documento. */
export const ADJUNTO_PREVIEW_HTML_DOC_STYLE =
  "html,body{background:#fff!important;color:#111!important;zoom:0.75}";

export function withBrowserPdfZoom(objectUrl: string): string {
  const base = objectUrl.split("#")[0] ?? objectUrl;
  return `${base}#zoom=${ADJUNTO_PREVIEW_BROWSER_PDF_ZOOM_PCT}`;
}

export function clampAdjuntoPreviewZoom(value: number): number {
  const stepped =
    Math.round(value / ADJUNTO_PREVIEW_ZOOM_STEP) * ADJUNTO_PREVIEW_ZOOM_STEP;
  return Math.min(
    ADJUNTO_PREVIEW_ZOOM_MAX,
    Math.max(ADJUNTO_PREVIEW_ZOOM_MIN, Math.round(stepped * 100) / 100),
  );
}
