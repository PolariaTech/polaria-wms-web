import type { CompradorListRow } from "@/modules/admin-panel";

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

/** Umbral para listar varias sugerencias; si nadie lo pasa, igual se ofrece el más cercano. */
const MIN_SUGGESTION_SCORE = 0.22;
const MAX_CANDIDATES = 4;
const AUTO_ASSIGN_SCORE = 0.82;
const AMBIGUITY_GAP = 0.08;

const STOP_TOKENS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "y",
  "en",
  "a",
  "al",
  "sa",
  "cv",
  "sapi",
  "rl",
  "inc",
  "ltd",
  "ltda",
  "hotel",
  "hoteles",
  "restaurante",
  "grupo",
  "the",
  "and",
  "for",
  "pedido",
  "para",
  "cliente",
]);

function normalizeMatchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenList(value: string): string[] {
  return normalizeMatchText(value)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP_TOKENS.has(t));
}

function editDistanceAtMost(a: string, b: string, max: number): boolean {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return false;
  if (la === 0 || lb === 0) return Math.max(la, lb) <= max;

  let prev = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i += 1) {
    const cur = new Array<number>(lb + 1);
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= lb; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(
        prev[j]! + 1,
        cur[j - 1]! + 1,
        prev[j - 1]! + cost,
      );
      rowMin = Math.min(rowMin, cur[j]!);
    }
    if (rowMin > max) return false;
    prev = cur;
  }
  return prev[lb]! <= max;
}

function tokensNearlyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  return editDistanceAtMost(a, b, 1);
}

function compradorSearchText(row: CompradorListRow): string {
  return `${row.comprador} ${row.codigo}`;
}

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
  if (!nombre && !codigo) return 0;

  if (needle === nombre || needle === codigo) return 1;
  if (codigo && (needle === codigo || codigo.includes(needle) || needle.includes(codigo))) {
    return 0.95;
  }

  // Contención fuerte: el nombre del catálogo está completo en el texto IA o viceversa.
  if (nombre.length >= 5 && (needle.includes(nombre) || nombre.includes(needle))) {
    const ratio =
      Math.min(needle.length, nombre.length) /
      Math.max(needle.length, nombre.length);
    return Math.max(0.75, 0.55 + 0.4 * ratio);
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

function poolActivos(
  compradores: readonly CompradorListRow[],
): CompradorListRow[] {
  const activos = compradores.filter((row) => row.estaActivo !== false);
  return activos.length > 0 ? [...activos] : [...compradores];
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
    pool.find((row) => {
      const nombre = normalizeMatchText(row.comprador);
      const codigo = normalizeMatchText(row.codigo);
      return nombre === needle || codigo === needle;
    }) ?? null;

  const scored: CompradorScored[] = pool.map((row) => ({
    comprador: row,
    score: scoreCompradorMatch(nombreExtraido ?? "", row),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.comprador.comprador.localeCompare(b.comprador.comprador, "es");
  });

  // Exacto → no hace falta sugerir (el caller auto-asigna).
  // Sin exacto → candidatos sobre umbral; si nadie pasa, el más cercano igual.
  let candidates: CompradorScored[] = [];
  if (!exact) {
    candidates = scored.filter((row) => row.score >= minScore).slice(0, limit);
    if (candidates.length === 0 && scored[0]) {
      candidates = [scored[0]];
    }
  }

  return {
    exact,
    best: exact ?? candidates[0]?.comprador ?? null,
    candidates,
  };
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
 * ¿Conviene auto-asignar el mejor fuzzy? Solo si el score es alto y no hay empate.
 */
export function shouldAutoAssignComprador(
  result: CompradorMatchResult,
): CompradorListRow | null {
  if (result.exact) return result.exact;
  const top = result.candidates[0];
  if (!top || top.score < AUTO_ASSIGN_SCORE) return null;
  const second = result.candidates[1];
  if (second && top.score - second.score < AMBIGUITY_GAP) return null;
  return top.comprador;
}
