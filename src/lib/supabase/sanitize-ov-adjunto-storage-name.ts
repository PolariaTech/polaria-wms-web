/**
 * Clave segura para Supabase Storage.
 * Rechaza acentos/espacios (p. ej. «Café») → error "Invalid key".
 * El nombre original se conserva aparte (metadata / query de descarga).
 */
export function sanitizeOvAdjuntoStorageFileName(name: string): string {
  const trimmed = name.trim() || "adjunto";
  const lastDot = trimmed.lastIndexOf(".");
  const stem = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
  const ext = lastDot > 0 ? trimmed.slice(lastDot + 1) : "";

  const asciiStem = stem
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 100);

  const asciiExt = ext
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 16)
    .toLowerCase();

  const safeStem = asciiStem || "adjunto";
  return asciiExt ? `${safeStem}.${asciiExt}` : safeStem;
}
