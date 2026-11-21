/**
 * REQ-369: señales de variedad/calibre que impiden match “seguro”
 * sin romper sinónimos Mateo (orejona↔romana), typos ni códigos de almacén.
 */

type CalibreRango = { min: number; max: number };

/**
 * Palabras de variedad/tipo/talla: si el cliente las pide y el SKU no las
 * cubre (ni por sinónimo), hay que pedir confirmación.
 * No incluye ruido (ACOE) ni “fresco” (espec / STOP en el ranker).
 */
const VARIETY_DISTINGUISHER_TOKENS = new Set([
  "larga",
  "largo",
  "largas",
  "largos",
  "corta",
  "corto",
  "cortas",
  "cortos",
  "italiana",
  "italiano",
  "italianas",
  "italianos",
  "orejona",
  "orejonas",
  "romana",
  "romanas",
  "romaine",
  "hass",
  "jass",
  "fuerte",
  "fuertes",
  "criollo",
  "criolla",
  "china",
  "chino",
  "baby",
  "cherry",
  "saladette",
  "bola",
  "mediano",
  "mediana",
  "medianos",
  "medianas",
  "grande",
  "grandes",
  "chico",
  "chica",
  "chicos",
  "chicas",
  "extra",
  "primera",
  "segunda",
  "tercera",
  "super",
  "macho",
  "hembra",
]);

/** Rangos de calibre/talla en el texto (paréntesis o «DE 210 A 230 GR»). */
function extractCalibreRanges(texto: string): CalibreRango[] {
  const t = (texto ?? "").normalize("NFD").replace(/\p{M}/gu, "");
  const out: CalibreRango[] = [];
  const push = (a: string, b: string) => {
    const min = Number(a.replace(",", "."));
    const max = Number(b.replace(",", "."));
    if (!Number.isFinite(min) || !Number.isFinite(max)) return;
    out.push({ min: Math.min(min, max), max: Math.max(min, max) });
  };
  for (const m of t.matchAll(
    /\b(?:DE\s+)?(\d+(?:[.,]\d+)?)\s*(?:A|AL|-|–|—)\s*(\d+(?:[.,]\d+)?)\s*(?:G|GR|KG|CM|MM)?\b/gi,
  )) {
    push(m[1] ?? "", m[2] ?? "");
  }
  return out;
}

function calibreRangesOverlap(a: CalibreRango, b: CalibreRango): boolean {
  return a.min <= b.max && b.min <= a.max;
}

/**
 * Ambos traen calibre y no se solapan (210–230 vs 140–170).
 * Si solo uno trae calibre (talla → espec), no hay conflicto.
 */
export function calibresClienteYCatalogoConflictivos(
  textoCliente: string,
  nombreCatalogo: string,
): boolean {
  const q = extractCalibreRanges(textoCliente);
  const p = extractCalibreRanges(nombreCatalogo);
  if (q.length === 0 || p.length === 0) return false;
  return !q.some((qr) => p.some((pr) => calibreRangesOverlap(qr, pr)));
}

export function unmatchedTokensIncluyenVariedad(
  unmatchedDistinctiveTokens: readonly string[],
): boolean {
  return unmatchedDistinctiveTokens.some((t) =>
    VARIETY_DISTINGUISHER_TOKENS.has(t),
  );
}

function tokensVariedadEnNombre(nombreCatalogo: string): string[] {
  return (nombreCatalogo ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length > 0 && VARIETY_DISTINGUISHER_TOKENS.has(t));
}

/**
 * El catálogo impone una variedad que el cliente no pidió (romana vs larga,
 * mediano vs hass). Si el SKU no trae variedad, o el cliente ya pidió esa
 * misma (AGUACATE HASS PRIMERA → AGUACATE PRIMERA), no bloquea: el extra
 * (hass, pata corta) puede ir a espec.
 */
export function variedadClienteChocaConOtraDelCatalogo(params: {
  textoCliente: string;
  unmatchedDistinctiveTokens: readonly string[];
  nombreCatalogo: string;
}): boolean {
  const pedidasNoCubiertas = params.unmatchedDistinctiveTokens.filter((t) =>
    VARIETY_DISTINGUISHER_TOKENS.has(t),
  );
  if (pedidasNoCubiertas.length === 0) return false;
  const enCatalogo = tokensVariedadEnNombre(params.nombreCatalogo);
  if (enCatalogo.length === 0) return false;
  const pedidasTodas = tokensVariedadEnNombre(params.textoCliente);
  return enCatalogo.some((v) => !pedidasTodas.includes(v));
}

/**
 * Falso positivo “seguro”: variedad descubierta o calibres que no solapan.
 * `codigoYaCoincide` / tokens ya pasan por el ranker (sinónimos incluidos).
 */
export function matchRequiereConfirmacionPorVariedadOCalibre(params: {
  textoCliente: string;
  nombreCatalogo: string;
  codigoYaCoincide: boolean;
  unmatchedDistinctiveTokens: readonly string[];
}): boolean {
  if (params.codigoYaCoincide) return false;
  if (
    variedadClienteChocaConOtraDelCatalogo({
      textoCliente: params.textoCliente,
      unmatchedDistinctiveTokens: params.unmatchedDistinctiveTokens,
      nombreCatalogo: params.nombreCatalogo,
    })
  ) {
    return true;
  }
  return calibresClienteYCatalogoConflictivos(
    params.textoCliente,
    params.nombreCatalogo,
  );
}
