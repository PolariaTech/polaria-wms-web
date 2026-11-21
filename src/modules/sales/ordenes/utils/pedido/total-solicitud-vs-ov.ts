/**
 * REQ-279: si la solicitud trae un total explícito y la OV no cuadra, avisar
 * antes de confirmar (mismo patrón que cliente/producto).
 */

/**
 * TOTAL / Total pedido / Gran total, con o sin moneda (MXN, $).
 * REQ-369: el PDF Hard Rock usa «Total pedido: MXN 59,798.90» — sin MXN no matcheaba.
 */
const TOTAL_SOLICITUD_RE =
  /(?:^|[\n\r])\s*(?:total(?:\s+(?:del\s+)?(?:documento|pedido|factura|cotizaci[oó]n))?|importe\s+total|gran\s+total)\b\s*[:=]?\s*(?:(?:MXN|USD|EUR)\s*)?\$?\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2})?)/gi;

const PREFER_TOTAL_LABEL_RE =
  /total\s+(?:del\s+)?pedido|gran\s+total|importe\s+total/i;

/** Interpreta montos estilo MX: 1,234.56 o 1.234,56 o 1234.56 */
export function parseMontoSolicitud(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, "").trim();
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;
  if (lastComma > lastDot) {
    // 1.234,56
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    // 1,234.56
    normalized = cleaned.replace(/,/g, "");
  } else if (lastComma >= 0) {
    normalized = cleaned.replace(",", ".");
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

/** Extrae el total declarado en el texto de la solicitud / correo. */
export function extractTotalSolicitudFromTexto(
  origenTexto: string | null | undefined,
): number | null {
  const text = origenTexto?.trim() ?? "";
  if (!text) return null;
  const hits: { label: string; value: number }[] = [];
  TOTAL_SOLICITUD_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOTAL_SOLICITUD_RE.exec(text)) != null) {
    const value = parseMontoSolicitud(match[1] ?? "");
    if (value == null) continue;
    hits.push({ label: match[0] ?? "", value });
  }
  if (hits.length === 0) return null;
  // Prefiere «Total pedido» / gran total; si no, el último (suele ser el pie).
  const preferred =
    hits.find((h) => PREFER_TOTAL_LABEL_RE.test(h.label)) ??
    hits[hits.length - 1]!;
  return preferred.value;
}

/**
 * REQ-279: busca TOTAL en varios orígenes (cuerpo + textos de adjuntos).
 * El primero que matchea gana (orden: cuerpo, luego cada adjunto).
 */
export function extractTotalSolicitudFromTextos(
  textos: readonly (string | null | undefined)[],
): number | null {
  for (const texto of textos) {
    const found = extractTotalSolicitudFromTexto(texto);
    if (found != null) return found;
  }
  return null;
}

/** Contenidos de texto ya extraídos de PDF/EML/etc. para buscar el total. */
export function textosDesdeArchivosExtraidos(
  archivos: readonly { tipo: string; contenido?: string | null }[],
): string[] {
  const out: string[] = [];
  for (const archivo of archivos) {
    if (archivo.tipo !== "texto") continue;
    const contenido = archivo.contenido?.trim() ?? "";
    if (contenido) out.push(contenido);
  }
  return out;
}

const TOLERANCIA_TOTAL_MXN = 0.05;

export type AvisoTotalSolicitud = {
  campo: "Total";
  fieldKey: "totalSolicitud";
  db: string;
  ia: string;
};

/** Compara total OV contra el total leído de la solicitud. */
export function buildAvisoTotalSolicitudVsOv(params: {
  totalOv: number;
  totalSolicitud: number | null;
}): AvisoTotalSolicitud | null {
  const { totalOv, totalSolicitud } = params;
  if (totalSolicitud == null) return null;
  if (!Number.isFinite(totalOv) || totalOv <= 0) return null;
  const diff = Math.abs(totalOv - totalSolicitud);
  if (diff <= TOLERANCIA_TOTAL_MXN) return null;
  const fmt = (n: number) =>
    n.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    });
  return {
    campo: "Total",
    fieldKey: "totalSolicitud",
    db: `Solicitud ${fmt(totalSolicitud)}`,
    ia: `OV ${fmt(totalOv)} · no cuadra con el total de la solicitud`,
  };
}
