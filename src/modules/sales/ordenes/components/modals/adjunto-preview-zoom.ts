export const ADJUNTO_PREVIEW_ZOOM_MIN = 0.5;
export const ADJUNTO_PREVIEW_ZOOM_MAX = 3;
export const ADJUNTO_PREVIEW_ZOOM_STEP = 0.25;
/** Zoom de los controles Polaria (+/−). */
export const ADJUNTO_PREVIEW_ZOOM_DEFAULT = 1;

/**
 * El PDF abre al ancho del panel, sin la barra nativa (un solo zoom: el de Polaria).
 * `fit` es el ajuste inicial; un número es el porcentaje que piden los botones +/−.
 */
export const ADJUNTO_PREVIEW_PDF_ZOOM_FIT = "page-width";

/** Fondo legible del HTML. Sin zoom interno: el tamaño lo marca el control de Polaria. */
export const ADJUNTO_PREVIEW_HTML_DOC_STYLE =
  "html,body{background:#fff!important;color:#111!important}";

export function withBrowserPdfZoom(
  objectUrl: string,
  zoom: number | "fit" = "fit",
): string {
  const base = objectUrl.split("#")[0] ?? objectUrl;
  const zoomValue =
    zoom === "fit"
      ? ADJUNTO_PREVIEW_PDF_ZOOM_FIT
      : String(Math.round(zoom * 100));
  return `${base}#toolbar=0&navpanes=0&zoom=${zoomValue}`;
}

/** Escala para que el HTML quepa al ancho. Null si ya cabe o no hay medida. */
export function htmlFitZoom(available: number, needed: number): number | null {
  if (available <= 0 || needed <= available + 2) return null;
  return clampAdjuntoPreviewZoom(available / needed);
}

export function clampAdjuntoPreviewZoom(value: number): number {
  const stepped =
    Math.round(value / ADJUNTO_PREVIEW_ZOOM_STEP) * ADJUNTO_PREVIEW_ZOOM_STEP;
  return Math.min(
    ADJUNTO_PREVIEW_ZOOM_MAX,
    Math.max(ADJUNTO_PREVIEW_ZOOM_MIN, Math.round(stepped * 100) / 100),
  );
}
