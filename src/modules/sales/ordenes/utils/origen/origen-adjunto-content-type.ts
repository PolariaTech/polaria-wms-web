/**
 * REQ-159: tipo MIME / detección HTML·EML al servir adjuntos en pestaña.
 * Separado de `origen-adjuntos.ts` para no cruzar el límite de 300 líneas.
 */

export function isHtmlOrigenAdjunto(item: {
  nombre: string;
  mime?: string | null;
}): boolean {
  const mime = (item.mime ?? "").toLowerCase();
  const name = item.nombre.toLowerCase();
  return (
    mime === "text/html" ||
    mime === "application/xhtml+xml" ||
    name.endsWith(".html") ||
    name.endsWith(".htm")
  );
}

export function isEmlOrigenAdjunto(item: {
  nombre: string;
  mime?: string | null;
}): boolean {
  const mime = (item.mime ?? "").toLowerCase();
  const name = item.nombre.toLowerCase();
  return (
    name.endsWith(".eml") ||
    mime.includes("message/rfc822") ||
    mime === "application/eml"
  );
}

/**
 * Content-Type al servir el archivo. Corrige octet-stream de Storage en HTML/EML
 * para que el navegador pinte en vez de descargar.
 */
export function resolveAdjuntoContentType(
  nombre: string,
  mime?: string | null,
): string {
  if (isHtmlOrigenAdjunto({ nombre, mime })) {
    return "text/html; charset=utf-8";
  }
  if (isEmlOrigenAdjunto({ nombre, mime })) {
    return "message/rfc822";
  }
  const raw = (mime ?? "").trim();
  if (raw && raw !== "application/octet-stream") return raw;
  const name = nombre.toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".txt")) return "text/plain; charset=utf-8";
  return raw || "application/octet-stream";
}
