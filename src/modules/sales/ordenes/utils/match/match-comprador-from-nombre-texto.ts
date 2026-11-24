import type { CompradorListRow } from "@/modules/admin-panel";

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

export function normalizeMatchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function tokenList(value: string): string[] {
  return normalizeMatchText(value)
    .split(" ")
    .filter((t) => t.length > 1 && !STOP_TOKENS.has(t));
}

export function editDistanceAtMost(a: string, b: string, max: number): boolean {
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

export function tokensNearlyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  return editDistanceAtMost(a, b, 1);
}

/** D. Comercial: `apodo` (sync) y override WMS — mismo criterio que el buscador del picker. */
export function compradorNombresComerciales(row: CompradorListRow): string[] {
  return [row.apodo, row.denominacionComercialOverride]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

export function compradorSearchText(row: CompradorListRow): string {
  return [row.comprador, row.codigo, ...compradorNombresComerciales(row)]
    .filter(Boolean)
    .join(" ");
}

export function esMatchExactoComprador(
  needle: string,
  row: CompradorListRow,
): boolean {
  if (!needle) return false;
  if (normalizeMatchText(row.comprador) === needle) return true;
  if (normalizeMatchText(row.codigo) === needle) return true;
  return compradorNombresComerciales(row).some(
    (nombre) => normalizeMatchText(nombre) === needle,
  );
}

export function poolActivos(
  compradores: readonly CompradorListRow[],
): CompradorListRow[] {
  const activos = compradores.filter((row) => row.estaActivo !== false);
  return activos.length > 0 ? [...activos] : [...compradores];
}
