import type { CompradorListRow } from "@/modules/admin-panel";
import {
  compradorNombresComerciales,
  compradorSearchText,
  esMatchExactoComprador,
  normalizeMatchText,
  poolActivos,
  tokenList,
  tokensNearlyEqual,
} from "./match-comprador-from-nombre-texto";

export interface CompradorScored {
  comprador: CompradorListRow;
  score: number;
}

export interface CompradorMatchResult {
  /** Coincidencia exacta (nombre o código normalizados). Auto-asignable. */
  exact: CompradorListRow | null;
  /** Mejor candidato fuzzy (puede coincidir con exact). */
  best: CompradorListRow | null;
  /** Hasta N candidatos ordenados por score. */
  candidates: CompradorScored[];
}

/**
 * Umbral alto: solo sugerir si hay señal real.
 * Por debajo → alerta de cliente faltante (sin “más cercano” inventado).
 */
const MIN_SUGGESTION_SCORE = 0.55;
const MAX_CANDIDATES = 4;

/**
 * Score 0–1 entre el nombre extraído por Mateo y un comprador del catálogo.
 */
export function scoreCompradorMatch(
  query: string,
  row: CompradorListRow,
): number {
  const needle = normalizeMatchText(query);
  if (!needle) return 0;

  const nombre = normalizeMatchText(row.comprador);
  const codigo = normalizeMatchText(row.codigo);
  const comerciales = compradorNombresComerciales(row).map(normalizeMatchText);
  if (!nombre && !codigo && comerciales.length === 0) return 0;

  if (esMatchExactoComprador(needle, row)) return 1;
  if (codigo && (needle === codigo || codigo.includes(needle) || needle.includes(codigo))) {
    return 0.95;
  }

  // Contención fuerte: razón social o D. Comercial ↔ texto IA.
  for (const etiqueta of [nombre, ...comerciales]) {
    if (
      etiqueta.length >= 5 &&
      (needle.includes(etiqueta) || etiqueta.includes(needle))
    ) {
      const ratio =
        Math.min(needle.length, etiqueta.length) /
        Math.max(needle.length, etiqueta.length);
      return Math.max(0.75, 0.55 + 0.4 * ratio);
    }
  }

  const qTokens = tokenList(query);
  const pTokens = tokenList(compradorSearchText(row));
  if (qTokens.length === 0 || pTokens.length === 0) return 0;

  let overlap = 0;
  for (const qt of qTokens) {
    if (pTokens.includes(qt)) {
      overlap += qt.length <= 3 ? 0.7 : 1;
      continue;
    }
    for (const pt of pTokens) {
      if (tokensNearlyEqual(qt, pt)) {
        overlap += 0.9;
        break;
      }
      if (qt.length >= 4 && pt.includes(qt)) {
        overlap += 0.55;
        break;
      }
      if (pt.length >= 4 && qt.includes(pt)) {
        overlap += 0.45;
        break;
      }
    }
  }

  const union = qTokens.length + pTokens.length - Math.min(overlap, qTokens.length);
  let score = Math.min(1, overlap / Math.max(union, 1));

  // Si casi todos los tokens del query están en el comprador, subir.
  const covered = qTokens.filter(
    (qt) =>
      pTokens.includes(qt) ||
      pTokens.some((pt) => tokensNearlyEqual(qt, pt) || pt.includes(qt)),
  ).length;
  if (qTokens.length > 0 && covered === qTokens.length) {
    score = Math.max(score, 0.78);
  } else if (qTokens.length >= 2 && covered / qTokens.length >= 0.66) {
    score = Math.max(score, 0.55);
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Rankea compradores contra el nombre que Mateo extrajo del pedido.
 */
export function rankCompradoresFromNombre(
  nombreExtraido: string | null | undefined,
  compradores: readonly CompradorListRow[],
  options?: { limit?: number; minScore?: number },
): CompradorMatchResult {
  const limit = options?.limit ?? MAX_CANDIDATES;
  const minScore = options?.minScore ?? MIN_SUGGESTION_SCORE;
  const needle = normalizeMatchText(nombreExtraido ?? "");

  if (!needle || compradores.length === 0) {
    return { exact: null, best: null, candidates: [] };
  }

  const pool = poolActivos(compradores);

  const exact =
    pool.find((row) => esMatchExactoComprador(needle, row)) ?? null;

  const scored: CompradorScored[] = pool.map((row) => ({
    comprador: row,
    score: scoreCompradorMatch(nombreExtraido ?? "", row),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.comprador.comprador.localeCompare(b.comprador.comprador, "es");
  });

  // Exacto → no listar en candidates (el caller auto-asigna).
  // Sin exacto → solo candidatos con score ≥ umbral (sin inventar el más cercano).
  let candidates: CompradorScored[] = [];
  if (!exact) {
    candidates = scored.filter((row) => row.score >= minScore).slice(0, limit);
  }

  return {
    exact,
    best: exact ?? candidates[0]?.comprador ?? null,
    candidates,
  };
}

/**
 * REQ-326: sugerencias para el picker (cualquier cliente).
 * Incluye match exacto (nombre / código / D. Comercial / apodo) y fuzzy
 * por encima de un umbral más permisivo que el de auto-asignar.
 */
export function sugerenciasCompradorParaPicker(
  nombreExtraido: string | null | undefined,
  compradores: readonly CompradorListRow[],
  options?: { limit?: number; minScore?: number },
): CompradorListRow[] {
  const limit = options?.limit ?? MAX_CANDIDATES;
  const minScore = options?.minScore ?? 0.35;
  const needle = normalizeMatchText(nombreExtraido ?? "");
  if (!needle || compradores.length === 0) return [];

  const pool = poolActivos(compradores);
  const exact = pool.find((row) => esMatchExactoComprador(needle, row)) ?? null;
  const scored: CompradorScored[] = pool
    .map((row) => ({
      comprador: row,
      score: scoreCompradorMatch(nombreExtraido ?? "", row),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.comprador.comprador.localeCompare(b.comprador.comprador, "es");
    });

  const out: CompradorListRow[] = [];
  if (exact) out.push(exact);
  for (const row of scored) {
    if (out.length >= limit) break;
    if (exact && row.comprador.idComprador === exact.idComprador) continue;
    if (row.score < minScore) continue;
    out.push(row.comprador);
  }
  return out;
}

/**
 * Match estricto: nombre o código exactamente iguales (normalizados).
 * Para auto-asignar sin riesgo. Usa `rankCompradoresFromNombre` para sugerencias.
 */
export function matchCompradorFromNombre(
  nombreExtraido: string | null | undefined,
  compradores: readonly CompradorListRow[],
): CompradorListRow | null {
  return rankCompradoresFromNombre(nombreExtraido, compradores).exact;
}

/**
 * Auto-asignar cliente: exacto, o fuzzy muy fuerte con ≥2 tokens distintivos
 * (REQ-116 FAIRMONT MAYAKOBA) y gap claro vs el 2.º. Un solo token
 * («Hilton») nunca auto-asigna.
 */
export function shouldAutoAssignComprador(
  result: CompradorMatchResult,
  nombreExtraido?: string | null,
): CompradorListRow | null {
  if (result.exact) return result.exact;

  const top = result.candidates[0];
  if (!top || top.score < 0.75) return null;

  const second = result.candidates[1];
  if (second && top.score - second.score < 0.12) return null;

  const qTokens = tokenList(nombreExtraido ?? top.comprador.comprador);
  const pTokens = tokenList(compradorSearchText(top.comprador));
  const distinctive = qTokens.filter((t) => t.length >= 5);
  const covered = distinctive.filter(
    (qt) =>
      pTokens.includes(qt) ||
      pTokens.some((pt) => tokensNearlyEqual(qt, pt) || pt.includes(qt)),
  );
  // Caso normal (REQ-116): ≥2 tokens fuertes cubiertos y score ≥ 0.82.
  if (covered.length >= 2 && top.score >= 0.82) return top.comprador;

  // REQ-311: un solo token de marca largo (≥8) con contención fuerte y gap claro
  // (ej. «FAIRMONT» → FAIRMONT MAYAKOBA). «Hilton» (6) sigue sin auto-asignar.
  if (
    covered.length === 1 &&
    (covered[0]?.length ?? 0) >= 8 &&
    top.score >= 0.75
  ) {
    return top.comprador;
  }

  return null;
}
