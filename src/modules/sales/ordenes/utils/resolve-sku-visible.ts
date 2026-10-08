import type { OrdenVentaLineaRow } from "../../shared/types/sales.types";
import { resolveOrdenVentaLineaTitulo } from "./orden-venta-display";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "./origen-correo-ordenes-trabajo";

function isArchSku(sku: string | null | undefined): boolean {
  return Boolean(sku?.trim().toUpperCase().startsWith("ARCH-"));
}

function parseCantidad(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(",", ".").trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function namesLooselyMatch(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) {
    return true;
  }
  const tokens = (text: string) =>
    text
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .split(/[^a-z0-9]+/i)
      .map((t) => t.trim())
      .filter((t) => t.length >= 4);
  const ta = tokens(left);
  const tb = tokens(right);
  if (ta.length === 0 || tb.length === 0) return false;
  const shared = ta.filter((t) => tb.includes(t));
  return shared.some((t) => t.length >= 5);
}

/**
 * SKU visible: evita ARCH-<uuid> del catálogo archivado.
 * Prioridad: sku usable del producto → Código producto del origen (OT/qty).
 */
export function resolveSkuVisible(input: {
  linea: OrdenVentaLineaRow;
  origenRenglones?: readonly OrigenCorreoRenglon[] | null;
  hija?: OrdenTrabajoHija | null;
}): string {
  const raw = input.linea.producto?.sku?.trim() || "";
  if (raw && !isArchSku(raw)) return raw;

  const titulo = resolveOrdenVentaLineaTitulo(input.linea).toLowerCase();
  const qty = input.linea.cantidad_pedida;
  const pool =
    input.hija?.renglones ??
    input.origenRenglones ??
    [];

  let best: { codigo: string; score: number } | null = null;
  for (const row of pool) {
    const prod = (row.Producto ?? "").trim();
    const codigo = (row["Codigo producto"] ?? "").trim();
    if (!codigo || !prod) continue;
    if (!namesLooselyMatch(titulo, prod)) continue;
    const rowQty = parseCantidad(row.Cantidad);
    let score = 1;
    if (rowQty > 0 && Math.abs(rowQty - qty) < 0.001) score = 3;
    else if (rowQty > 0 && Math.abs(rowQty - qty) / rowQty < 0.05) score = 2;
    if (!best || score > best.score) {
      best = { codigo, score };
    }
  }

  return best?.codigo || "";
}
