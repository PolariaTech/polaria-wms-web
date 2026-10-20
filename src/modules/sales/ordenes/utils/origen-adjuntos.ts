/** Adjunto de origen de pedido (Supabase Storage / legado Cloudinary). */
export type OrigenAdjunto = {
  nombre: string;
  url?: string | null;
  /** Path en bucket ov-adjuntos (cuenta/uuid-nombre). */
  path?: string | null;
  mime?: string | null;
  bytes?: number | null;
  resourceType?: "image" | "raw" | "video" | "auto" | "storage" | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceAdjunto(raw: unknown): OrigenAdjunto | null {
  if (typeof raw === "string") {
    const nombre = raw.trim();
    return nombre ? { nombre } : null;
  }
  if (!isRecord(raw)) return null;
  const nombre = String(raw.nombre ?? raw.name ?? "").trim();
  if (!nombre) return null;
  const url = String(raw.url ?? "").trim() || null;
  const path = String(raw.path ?? "").trim() || null;
  const mime = String(raw.mime ?? raw.contentType ?? "").trim() || null;
  const bytesRaw = raw.bytes ?? raw.size;
  const bytes =
    typeof bytesRaw === "number" && Number.isFinite(bytesRaw)
      ? bytesRaw
      : typeof bytesRaw === "string" && bytesRaw.trim()
        ? Number(bytesRaw)
        : null;
  const resourceTypeRaw = String(raw.resourceType ?? raw.resource_type ?? "")
    .trim()
    .toLowerCase();
  const resourceType =
    resourceTypeRaw === "image" ||
    resourceTypeRaw === "raw" ||
    resourceTypeRaw === "video" ||
    resourceTypeRaw === "auto" ||
    resourceTypeRaw === "storage"
      ? resourceTypeRaw
      : null;
  return {
    nombre,
    ...(url ? { url } : {}),
    ...(path ? { path } : {}),
    ...(mime ? { mime } : {}),
    ...(Number.isFinite(bytes) && bytes != null ? { bytes } : {}),
    ...(resourceType ? { resourceType } : {}),
  };
}

/**
 * Parsea `origen_archivos`: JSON de adjuntos con URL, o legado "a.pdf, b.jpg".
 */
export function parseOrigenArchivos(
  raw: string | null | undefined,
): OrigenAdjunto[] {
  const text = (raw ?? "").trim();
  if (!text) return [];

  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(coerceAdjunto)
        .filter((row): row is OrigenAdjunto => row != null);
    } catch {
      // cae a legado
    }
  }

  return text
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((nombre) => ({ nombre }));
}

/** Serializa adjuntos para la columna text `origen_archivos`. */
export function serializeOrigenArchivos(
  items: readonly OrigenAdjunto[] | null | undefined,
): string | null {
  if (!items || items.length === 0) return null;
  const cleaned: OrigenAdjunto[] = items.flatMap((item) => {
    const nombre = item.nombre.trim();
    if (!nombre) return [];
    const url = item.url?.trim() || undefined;
    const row: OrigenAdjunto = {
      nombre,
      ...(url ? { url } : {}),
      ...(item.path?.trim() ? { path: item.path.trim() } : {}),
      ...(item.mime?.trim() ? { mime: item.mime.trim() } : {}),
      ...(typeof item.bytes === "number" && Number.isFinite(item.bytes)
        ? { bytes: item.bytes }
        : {}),
      ...(item.resourceType ? { resourceType: item.resourceType } : {}),
    };
    return [row];
  });

  if (cleaned.length === 0) return null;
  // Si ninguno tiene URL ni path, mantener formato legado legible.
  if (cleaned.every((row) => !row.url && !row.path)) {
    return cleaned.map((row) => row.nombre).join(", ");
  }
  return JSON.stringify(cleaned);
}

export function nombresOrigenAdjuntos(
  items: readonly OrigenAdjunto[],
): string[] {
  return items.map((item) => item.nombre).filter(Boolean);
}

function hasAdjuntoFile(item: OrigenAdjunto): boolean {
  return Boolean(item.path?.trim() || item.url?.trim());
}

/** True si Cloudinary bloquea PDF (cuenta con Restricted media types). */
export function isBrokenCloudinaryPdfUrl(url: string): boolean {
  return (
    url.includes("res.cloudinary.com") &&
    url.includes("/image/upload/") &&
    (url.toLowerCase().includes(".pdf") || url.includes("fl_attachment"))
  );
}

export function canPreviewOrigenAdjunto(item: OrigenAdjunto): boolean {
  const mime = (item.mime ?? "").toLowerCase();
  const name = item.nombre.toLowerCase();
  if (!hasAdjuntoFile(item)) return false;
  const url = item.url?.trim() || "";
  if (url && isBrokenCloudinaryPdfUrl(url) && !item.path?.trim()) return false;
  if (mime.startsWith("image/") && !name.endsWith(".pdf")) return true;
  if (mime === "application/pdf" || name.endsWith(".pdf")) return true;
  return false;
}

function buildStorageProxyUrl(
  item: OrigenAdjunto,
  disposition: "inline" | "attachment",
): string {
  const path = item.path?.trim();
  if (path) {
    const qs = new URLSearchParams({
      path,
      nombre: item.nombre,
      disposition,
    });
    return `/api/ov-adjuntos/file?${qs.toString()}`;
  }
  const url = item.url?.trim() || "";
  if (url.startsWith("/api/ov-adjuntos/")) {
    const u = new URL(url, "http://local");
    u.searchParams.set("disposition", disposition);
    return `${u.pathname}?${u.searchParams.toString()}`;
  }
  return url;
}

/** Convierte partes extraídas de un .eml en adjuntos descargables vía API. */
export function origenAdjuntosFromEmlParts(
  emlPath: string,
  parts: readonly {
    index: number;
    nombre: string;
    mime: string;
    bytes: number;
  }[],
): OrigenAdjunto[] {
  const path = emlPath.trim();
  if (!path || parts.length === 0) return [];
  return parts.map((part) => {
    const qs = new URLSearchParams({
      path,
      index: String(part.index),
      nombre: part.nombre,
    });
    return {
      nombre: part.nombre,
      mime: part.mime,
      bytes: part.bytes,
      url: `/api/ov-adjuntos/eml-parts/file?${qs.toString()}`,
      resourceType: "storage" as const,
    };
  });
}

/** URL para abrir/ver (proxy Storage o URL directa). */
export function origenAdjuntoViewUrl(item: OrigenAdjunto): string {
  if (item.path?.trim() || (item.url?.trim() || "").startsWith("/api/")) {
    return buildStorageProxyUrl(item, "inline");
  }
  const url = item.url?.trim() || "";
  if (url && isBrokenCloudinaryPdfUrl(url)) return "";
  return url;
}

/** URL de descarga. */
export function origenAdjuntoDownloadUrl(item: OrigenAdjunto): string {
  if (item.path?.trim() || (item.url?.trim() || "").startsWith("/api/")) {
    return buildStorageProxyUrl(item, "attachment");
  }
  const url = item.url?.trim() || "";
  if (url && isBrokenCloudinaryPdfUrl(url)) return "";
  return url;
}

export function labelTipoOrigenAdjunto(item: OrigenAdjunto): string {
  const mime = (item.mime ?? "").toLowerCase();
  const name = item.nombre.toLowerCase();
  if (mime.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp)$/i.test(name)) {
    return "IMG";
  }
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "PDF";
  if (
    mime.includes("word") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ) {
    return "DOC";
  }
  if (
    mime.includes("sheet") ||
    mime.includes("excel") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".csv")
  ) {
    return "XLS";
  }
  if (name.endsWith(".eml") || mime.includes("message")) return "EML";
  const ext = name.includes(".") ? name.split(".").pop() : "";
  return (ext || "FILE").slice(0, 4).toUpperCase();
}
