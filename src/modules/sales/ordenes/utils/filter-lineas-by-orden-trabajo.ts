import type { OrdenVentaLineaRow } from "../../shared/types/sales.types";
import { productNamesLooselyMatch } from "./find-closest-producto-catalogo";
import { resolveOrdenVentaLineaTitulo } from "./orden-venta-display";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "./origen-correo-ordenes-trabajo";

type LineaFiltrable = {
  producto?: OrdenVentaLineaRow["producto"] | unknown;
  cantidad_pedida: number | string;
  /** Nombre visible (formulario) cuando el SKU del producto quedó archivado. */
  matchNombre?: string | null;
  /** Código / SKU de captura (formulario). */
  matchCodigo?: string | null;
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

function normalizeMatchCodigo(raw: string | null | undefined): string {
  const sku = (raw ?? "").trim().toLowerCase();
  // Productos archivados al reemplazar catálogo: ARCH-<uuid> no sirve para match.
  if (!sku || sku.startsWith("arch-")) return "";
  return sku;
}

function lineaSku(linea: LineaFiltrable): string {
  const fromMatch = normalizeMatchCodigo(linea.matchCodigo);
  if (fromMatch) return fromMatch;
  const producto = lineaProducto(linea);
  if (!producto || Array.isArray(producto)) return "";
  return normalizeMatchCodigo(producto.sku);
}

function lineaTitulo(linea: LineaFiltrable): string {
  const fromMatch = linea.matchNombre?.trim();
  if (fromMatch) return fromMatch.toLowerCase();
  return resolveOrdenVentaLineaTitulo({
    producto: lineaProducto(linea),
  }).toLowerCase();
}

function significantTokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4);
}

/** AGUACATE JASS ≈ AGUACATE HASS; BLUE BERRY ≈ ARÁNDANOS/BLUEBERRIES. */
function namesLooselyMatch(a: string, b: string): boolean {
  if (productNamesLooselyMatch(a, b)) return true;

  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) {
    return true;
  }
  const ta = significantTokens(left);
  const tb = significantTokens(right);
  if (ta.length === 0 || tb.length === 0) return false;
  const shared = ta.filter((t) => tb.includes(t));
  if (shared.some((t) => t.length >= 5)) return true;
  return shared.length / Math.min(ta.length, tb.length) >= 0.5;
}

function matchesProducto(
  linea: LineaFiltrable,
  row: OrigenCorreoRenglon,
): boolean {
  const prod = (row.Producto ?? "").trim().toLowerCase();
  const cod = (row["Codigo producto"] ?? "").trim().toLowerCase();
  if (!prod && !cod) return false;

  const titulo = lineaTitulo(linea);
  const sku = lineaSku(linea);

  if (cod && sku && (sku === cod || sku.includes(cod) || cod.includes(sku))) {
    return true;
  }
  if (prod && namesLooselyMatch(titulo, prod)) {
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

export type FilterLineasOtOptions = {
  /**
   * Si no hubo match:
   * - `none` (default) → solo lo de esa OT; nunca mezclar el resto de la venta
   * - `all` → legado (evitar en detalle/edición)
   */
  emptyFallback?: "all" | "none";
};

/**
 * Filtra líneas de la OV que pertenecen a una orden de trabajo hija.
 * Empareja 1:1 con los renglones de origen_correo (producto + cantidad)
 * para no arrastrar el mismo SKU de otras OTs de la misma venta.
 */
export function filterLineasByOrdenTrabajoHija<T extends LineaFiltrable>(
  allLineItems: readonly T[],
  hija: OrdenTrabajoHija | null | undefined,
  options?: FilterLineasOtOptions,
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

  if (matched.length > 0) return matched;
  return (options?.emptyFallback ?? "none") === "all"
    ? [...allLineItems]
    : matched;
}

type LineaConId = LineaFiltrable & { id_linea_orden_venta: string };

/**
 * Asigna otId (id de orden de trabajo) a cada línea de detalle,
 * emparejando 1:1 con los renglones de origen_correo.
 */
export function buildOtIdByDetalleLineaId(
  lineas: readonly LineaConId[],
  hijas: readonly OrdenTrabajoHija[],
): Map<string, string> {
  const result = new Map<string, string>();
  const used = new Set<number>();

  for (const hija of hijas) {
    for (const row of hija.renglones) {
      let bestIndex = -1;
      let bestScore = -1;
      for (let i = 0; i < lineas.length; i++) {
        if (used.has(i)) continue;
        const score = scoreMatch(lineas[i]!, row);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      if (bestIndex >= 0) {
        used.add(bestIndex);
        result.set(lineas[bestIndex]!.id_linea_orden_venta, hija.id);
      }
    }
  }

  return result;
}

type LineaFormOt = {
  nombre: string;
  codigo: string;
  cantidadInput: string;
  otId?: string;
};

/**
 * Asigna otId a líneas del formulario de captura/edición usando nombre+código+cantidad.
 */
export function assignOtIdsToFormLineas<T extends LineaFormOt>(
  lineas: readonly T[],
  hijas: readonly OrdenTrabajoHija[],
  parseCantidad: (raw: string) => number,
): Array<T & { otId?: string }> {
  if (hijas.length === 0) return lineas.map((linea) => ({ ...linea }));

  const wrapped = lineas.map((linea, index) => ({
    index,
    linea,
    cantidad_pedida: parseCantidad(linea.cantidadInput),
    matchNombre: linea.nombre,
    matchCodigo: linea.codigo,
    producto: {
      sku: normalizeMatchCodigo(linea.codigo) || null,
      descripcion: linea.nombre,
      metadatos_catalogo: null,
    },
  }));

  const used = new Set<number>();
  const otByIndex = new Map<number, string>();

  for (const hija of hijas) {
    for (const row of hija.renglones) {
      let bestIndex = -1;
      let bestScore = -1;
      for (const item of wrapped) {
        if (used.has(item.index)) continue;
        const score = scoreMatch(item, row);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = item.index;
        }
      }
      if (bestIndex >= 0) {
        used.add(bestIndex);
        otByIndex.set(bestIndex, hija.id);
      }
    }
  }

  return lineas.map((linea, index) => ({
    ...linea,
    otId: otByIndex.get(index) ?? linea.otId,
  }));
}
