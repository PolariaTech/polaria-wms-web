import { parseDecimalEs } from "@/lib/utils/decimal-es";
import type { CompradorListRow } from "../services/compradores.service";

export interface EquivalenciaCreateDraft {
  alias: string;
  precioTexto: string;
}

export function formatCompradorLabel(row: CompradorListRow): string {
  return `${row.codigo} — ${row.comprador}`;
}

export function precioToTexto(precio: number | undefined): string {
  if (precio == null) return "";
  return String(precio);
}

export function isSamePrecio(
  original: number | undefined,
  precioTexto: string,
): boolean {
  const trimmed = precioTexto.trim();
  if (original == null) return trimmed === "";
  if (trimmed === "") return false;
  const parsed = parseDecimalEs(trimmed);
  if (parsed == null) return false;
  return Math.abs(parsed - original) < 1e-9;
}

export const GRID_HEAD =
  "sticky top-0 z-10 border-b border-polaria-t-20 bg-polaria-bg px-3 py-2.5 polaria-text-caption font-medium text-polaria-w-50";
export const GRID_CELL =
  "border-b border-polaria-w-08 border-r border-polaria-w-08 px-0 py-0 polaria-text-body-sm last:border-r-0";
export const GRID_PAD = "px-3 py-2.5";

export function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function matchesSearch(haystack: string, query: string): boolean {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const normalized = normalizeSearch(haystack);
  return tokens.every((token) => normalized.includes(token));
}
