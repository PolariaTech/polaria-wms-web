import type { CSSProperties } from "react";
import type { OrigenAdjunto } from "../../utils/origen/origen-adjuntos";
import { ADJUNTO_PREVIEW_HTML_DOC_STYLE } from "./adjunto-preview-zoom";

export function esAdjuntoImagen(item: OrigenAdjunto): boolean {
  const mime = (item.mime ?? "").toLowerCase();
  const name = item.nombre.toLowerCase();
  if (mime.startsWith("image/") && !name.endsWith(".pdf")) return true;
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(name);
}

export function esAdjuntoHtmlResponse(
  contentType: string | null | undefined,
  nombreArchivo?: string,
): boolean {
  const normalized = (contentType ?? "").toLowerCase();
  return (
    normalized.includes("text/html") ||
    /\.html?$/i.test(nombreArchivo ?? "")
  );
}

/**
 * REQ-311: blob: no carga CSS relativo → totales/tablas en blanco.
 * srcdoc + fondo blanco fuerza legibilidad del HTML Accor/OC.
 */
export function buildAdjuntoHtmlSrcDoc(html: string): string {
  if (html.includes("<head")) {
    return html.replace(
      /<head([^>]*)>/i,
      `<head$1><base target="_blank"><style>${ADJUNTO_PREVIEW_HTML_DOC_STYLE}</style>`,
    );
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${ADJUNTO_PREVIEW_HTML_DOC_STYLE}</style></head><body>${html}</body></html>`;
}

/**
 * REQ-327: el área escalada debe ser 100/zoom del viewport para que,
 * tras scale, ocupe todo el alto/ancho disponible (sin hueco negro).
 */
export function buildAdjuntoZoomStyle(zoom: number): CSSProperties {
  return {
    transform: `scale(${zoom})`,
    transformOrigin: "top left" as const,
    width: `${100 / zoom}%`,
    height: `${100 / zoom}%`,
    minHeight: `${100 / zoom}%`,
  };
}
