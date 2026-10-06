import type { OrdenVentaLineaRow } from "../../shared/types/sales.types";
import { resolveOrdenVentaLineaTitulo } from "./orden-venta-display";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "./origen-correo-ordenes-trabajo";

type LineaFiltrable = {
  producto?: OrdenVentaLineaRow["producto"] | unknown;
  cantidad_pedida: number | string;
};

function parseCantidadRenglon(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(",", ".").trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function lineaCantidad(linea: LineaFiltrable): number {
  return parseCantidadRenglon(linea.cantidad_pedida);
}

function lineaProducto(
  linea: LineaFiltrable,
): OrdenVentaLineaRow["producto"] | null {
  const producto = linea.producto;
  if (!producto) return null;
  if (Array.isArray(producto)) {
    return (producto[0] as OrdenVentaLineaRow["producto"]) ?? null;
  }
  return producto as OrdenVentaLineaRow["producto"];
}

function lineaSku(linea: LineaFiltrable): string {
  const producto = lineaProducto(linea);
  if (!producto || Array.isArray(producto)) return "";
  return (producto.sku ?? "").trim().toLowerCase();
}

function matchesProducto(
  linea: LineaFiltrable,
  row: OrigenCorreoRenglon,
): boolean {
  const prod = (row.Producto ?? "").trim().toLowerCase();
  const cod = (row["Codigo producto"] ?? "").trim().toLowerCase();
  if (!prod && !cod) return false;

  const titulo = resolveOrdenVentaLineaTitulo({
    producto: lineaProducto(linea),
  }).toLowerCase();
  const sku = lineaSku(linea);

  if (cod && sku && (sku === cod || sku.includes(cod) || cod.includes(sku))) {
    return true;
  }
  if (prod && (titulo === prod || titulo.includes(prod) || prod.includes(titulo))) {
    return true;
  }
  if (cod && (titulo === cod || titulo.includes(cod))) {
    return true;
  }
  return false;
}

function scoreMatch(linea: LineaFiltrable, row: OrigenCorreoRenglon): number {
  if (!matchesProducto(linea, row)) return -1;
  const qty = parseCantidadRenglon(row.Cantidad);
  const lineaQty = lineaCantidad(linea);
  if (qty <= 0) return 1;
  const delta = Math.abs(lineaQty - qty);
  if (delta < 0.001) return 3;
  if (delta / qty < 0.05) return 2;
  return 1;
}

/**
 * Filtra líneas de la OV que pertenecen a una orden de trabajo hija.
 * Empareja 1:1 con los renglones de origen_correo (producto + cantidad)
 * para no arrastrar el mismo SKU de otras OTs de la misma venta.
 */
export function filterLineasByOrdenTrabajoHija<T extends LineaFiltrable>(
  allLineItems: readonly T[],
  hija: OrdenTrabajoHija | null | undefined,
): T[] {
  if (!hija) return [...allLineItems];
  if (hija.renglones.length === 0) return [...allLineItems];

  const used = new Set<number>();
  const matched: T[] = [];

  for (const row of hija.renglones) {
    let bestIndex = -1;
    let bestScore = -1;

    for (let i = 0; i < allLineItems.length; i++) {
      if (used.has(i)) continue;
      const score = scoreMatch(allLineItems[i]!, row);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    if (bestIndex >= 0) {
      used.add(bestIndex);
      matched.push(allLineItems[bestIndex]!);
    }
  }

  return matched.length > 0 ? matched : [...allLineItems];
}
