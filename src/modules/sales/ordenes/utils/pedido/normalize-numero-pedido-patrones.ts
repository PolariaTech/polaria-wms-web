const OC_LABEL_RE =
  /(?:oc\s*generada|o\.?\s*c\.?\s*generada|orden\s+de\s+compra(?:\s+del\s+cliente)?|n[úu]mero\s+de\s+(?:pedido|orden|oc)|(?:^|[\s|:;])(?:oc|po)(?:\s*(?:number|#|no\.?|n[º°]?))?)\s*[:#.\-\s|]*([A-Z0-9][A-Z0-9\-\/]{4,20})/gi;

/**
 * XPU HA / hoteles: "REQUISICION # 50179" O, en PDFs unpdf, "50179REQUISICION #"
 * (el número va ANTES del rótulo). NO usar el título "Requisición de Compra"
 * — engancha el Artículo (00001678).
 */
const REQUISICION_NUM_BEFORE_RE =
  /(\d{4,12})\s*requisici[oó]n\s*#/gi;
const REQUISICION_NUM_AFTER_RE =
  /requisici[oó]n\s*(?:(?:n[uú]mero|no\.?|n[º°])\s*|#|:)\s*[\r\n\s]*(\d{4,12})\b/gi;

const FILENAME_OC_RE = /^(\d{8,20})(?:[_\s.-]|$)/i;

/**
 * PO/OCC hotel/SAP (con o sin ceros). SLS usa 15–16 dígitos
 * (ej. 000000000028593, 0020000000028545). Artículos tipo 00001678 quedan fuera.
 */
const OC_NUMERIC_LEN_RE = /^\d{9,20}$/;
const OC_NUMERIC_TOKEN_RE = /\b(\d{9,20})\b/g;

/**
 * IDs de "Usuario" / centro suelen ser 6–8 dígitos (ej. 3672091).
 * Requisiciones hotel (~5 dígitos, ej. 50184) NO deben unificarse como Usuario.
 */
export function looksLikeUsuarioId(value: string): boolean {
  return /^\d{6,8}$/.test(value.trim());
}

/**
 * SKU / Artículo con ceros a la izquierda (ej. 00001678) — no es OCC.
 * PO/OCC largas con padding (9–20 dígitos, SLS) SÍ son OCC.
 */
export function looksLikeArticuloSku(value: string): boolean {
  const v = value.trim();
  // Misma franja que Oc Generada / PO hotel: no descartar como Artículo.
  if (OC_NUMERIC_LEN_RE.test(v)) return false;
  return /^0{2,}\d+$/.test(v) || /^0+\d{5,}$/.test(v);
}

/** Basura típica de OCR/PDF (ej. "rAutorizado" cerca de columna Autoriza). */
export function isGarbageOcValue(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  if (!v) return true;
  if (/autoriz/i.test(v)) return true;
  if (looksLikeArticuloSku(v)) return true;
  if (/^(solicita|comentario|departamento|almacen|almacén)$/i.test(v)) {
    return true;
  }
  // Código de OC/PO casi siempre trae dígitos (salvo raros alfanuméricos cortos).
  if (!/\d/.test(v) && v.length < 10) return true;
  return false;
}

export function looksLikeOcCode(value: string): boolean {
  const v = value.trim();
  if (!v || isGarbageOcValue(v)) return false;
  // SAP / Oc Generada / PO hotel (9–20 dígitos; no confundir con Usuario 5–8).
  if (OC_NUMERIC_LEN_RE.test(v)) return true;
  if (/^[A-Z]{2,}\d{4,}$/i.test(v)) return true;
  return v.length >= 8 && /[A-Z0-9]/i.test(v);
}

export function collectFromRequisicionLabels(sourceText: string): string[] {
  const hits: string[] = [];
  // Preferir número pegado ANTES del rótulo (orden real de unpdf en XPU HA).
  for (const match of sourceText.matchAll(REQUISICION_NUM_BEFORE_RE)) {
    const raw = (match[1] ?? "").trim();
    if (raw && !looksLikeArticuloSku(raw)) hits.push(raw);
  }
  for (const match of sourceText.matchAll(REQUISICION_NUM_AFTER_RE)) {
    const raw = (match[1] ?? "").trim();
    if (raw && !looksLikeArticuloSku(raw)) hits.push(raw);
  }
  return hits;
}

export function collectFromLabels(sourceText: string): string[] {
  const hits: string[] = [];
  for (const match of sourceText.matchAll(OC_LABEL_RE)) {
    const raw = (match[1] ?? "").trim();
    if (!raw) continue;
    if (/^(generada|pedido|compra|number|no|cliente)$/i.test(raw)) continue;
    hits.push(raw);
  }
  return hits;
}

export function collectFromFilenames(fileNames: readonly string[]): string[] {
  const hits: string[] = [];
  for (const name of fileNames) {
    const base = name.split(/[/\\]/).pop() ?? name;
    const m = base.match(FILENAME_OC_RE);
    if (m?.[1]) hits.push(m[1]);
  }
  return hits;
}

/**
 * Frecuencia de tokens numéricos largos (Oc Generada repetida en tablas).
 * Ignora claves SAP tipo X200011700.
 */
export function collectFrequentNumericOcs(
  sourceText: string,
): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();
  for (const match of sourceText.matchAll(OC_NUMERIC_TOKEN_RE)) {
    const v = match[1]!;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || b.value.length - a.value.length);
}
