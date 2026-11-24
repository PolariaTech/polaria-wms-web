import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { rankProductosCatalogo } from "../../utils/match/find-closest-producto-catalogo";

/** Solo tras confirmar: en por_confirmar el usuario aún no eligió. */
export function usuarioSiConfirmado(confirmado: boolean, value: string): string {
  return confirmado ? value : "";
}

export function firstNonEmpty(values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Mateo solo muestra sugerencia real (catálogo / interpretación).
 * Si es un eco del correo → vacío (= «Sin propuesta» en UI).
 */
export function mateoSoloSugerencia(sugerido: string, correo: string): string {
  const value = sugerido.trim();
  if (!value) return "";
  if (normalizeKey(value) === normalizeKey(correo)) return "";
  return value;
}

export function formatMateoRef(ref: {
  nombre?: string | null;
  codigo?: string | null;
} | null | undefined): string {
  if (!ref) return "";
  const nombre = (ref.nombre ?? "").trim();
  const codigo = (ref.codigo ?? "").trim();
  if (nombre && codigo) return `${nombre} (${codigo})`;
  return nombre || codigo;
}

export function suggestProductoMateo(
  textoCorreo: string,
  matchSugerido: string,
  catalogo: readonly ProductoVentaOption[],
): { label: string; producto: ProductoVentaOption | null } {
  if (matchSugerido.trim()) {
    return { label: matchSugerido.trim(), producto: null };
  }
  const query = textoCorreo.trim();
  if (!query || catalogo.length === 0) {
    return { label: "", producto: null };
  }
  const ranked = rankProductosCatalogo(query, catalogo);
  const best = ranked.best ?? ranked.candidates[0]?.producto ?? null;
  if (!best) return { label: "", producto: null };
  const label = firstNonEmpty([best.nombre, best.codigo]);
  return {
    label: mateoSoloSugerencia(label, textoCorreo) || label,
    producto: best,
  };
}

export function formatCantidadCorreo(value: number | string | undefined): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatKgEs(value);
  }
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

export function formatPrecioCorreo(value: number | string | undefined): string {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return `$${formatPrecioEs(value)}`;
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(",", ".").trim());
    if (Number.isFinite(n) && n > 0) return `$${formatPrecioEs(n)}`;
    return value.trim();
  }
  return "";
}