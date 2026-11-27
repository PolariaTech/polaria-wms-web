import type { OrdenVentaLineaRow } from "../../../shared/types/sales.types";
import { productNamesLooselyMatch } from "../match/find-closest-producto-catalogo";
import { resolveOrdenVentaLineaTitulo } from "../display/orden-venta-display";
import {
  emparejarLineasConRenglones,
  normalizarTextoProducto,
  textoClienteDeLinea,
} from "./emparejar-lineas-renglones";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../origen/origen-correo-ordenes-trabajo";

type LineaFiltrable = {
  producto?: OrdenVentaLineaRow["producto"] | unknown;
  cantidad_pedida: number | string;
  /** Nombre visible (formulario) cuando el SKU del producto quedó archivado. */
  matchNombre?: string | null;
  /** Código / SKU de captura (formulario). */
  matchCodigo?: string | null;
  /** Texto del cliente (formulario); en BD viene en `match_producto.textoCliente`. */
  matchTextoCliente?: string | null;
  match_producto?: unknown;
  precio_unitario?: number | string | null;
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

/**
 * Nivel de coincidencia de producto (mayor = más confiable):
 * 2 código igual · 1 nombre sin códigos en conflicto · 0 nombre parecido pero
 * códigos distintos (REQ-436: COLIFLOR ≈ COL MORADA) · -1 no coincide.
 */
function nivelMatchProducto(
  linea: LineaFiltrable,
  row: OrigenCorreoRenglon,
): number {
  const prod = (row.Producto ?? "").trim().toLowerCase();
  const cod = (row["Codigo producto"] ?? "").trim().toLowerCase();
  if (!prod && !cod) return -1;

  const titulo = lineaTitulo(linea);
  const sku = lineaSku(linea);

  if (cod && sku && (sku === cod || sku.includes(cod) || cod.includes(sku))) {
    return 2;
  }
  const codigosEnConflicto = Boolean(cod && sku);
  if (prod && namesLooselyMatch(titulo, prod)) {
    return codigosEnConflicto ? 0 : 1;
  }
  if (cod && (titulo === cod || titulo.includes(cod))) {
    return 1;
  }
  return -1;
}

function puntajeCantidad(linea: LineaFiltrable, row: OrigenCorreoRenglon): number {
  const qty = parseCantidadRenglon(row.Cantidad);
  const lineaQty = lineaCantidad(linea);
  if (qty <= 0) return 1;
  const delta = Math.abs(lineaQty - qty);
  if (delta < 0.001) return 3;
  if (delta / qty < 0.05) return 2;
  return 1;
}

/** -1 sin match; el nivel de producto pesa más que la cantidad. */
export function scoreMatch(linea: LineaFiltrable, row: OrigenCorreoRenglon): number {
  const nivel = nivelMatchProducto(linea, row);
  if (nivel < 0) return -1;
  return nivel * 10 + puntajeCantidad(linea, row);
}

/** REQ-425: el texto del cliente idéntico al renglón gana a cualquier parecido. */
const BONO_TEXTO_CLIENTE = 100;

function puntajeEmparejamiento(
  linea: LineaFiltrable,
  row: OrigenCorreoRenglon,
): number {
  const base = scoreMatch(linea, row);
  const textoRenglon = normalizarTextoProducto(row.Producto);
  const texto = textoClienteDeLinea(linea);
  if (!texto || texto !== textoRenglon) {
    // Sin texto del cliente (legado): el mismo nombre desempata entre parecidos.
    const mismoNombre = normalizarTextoProducto(lineaTitulo(linea)) === textoRenglon;
    return base >= 0 && mismoNombre ? base + 5 : base;
  }
  const desempatePrecio = mismoPrecio(linea, row) ? 1 : 0;
  return (
    BONO_TEXTO_CLIENTE +
    Math.max(base, 10 + puntajeCantidad(linea, row)) +
    desempatePrecio
  );
}

/** Mismo producto y cantidad en dos tareas: el precio dice cuál es cuál. */
function mismoPrecio(linea: LineaFiltrable, row: OrigenCorreoRenglon): boolean {
  const precioLinea = parseCantidadRenglon(linea.precio_unitario ?? undefined);
  const precioRenglon = parseCantidadRenglon(row.Precio);
  return Math.abs(precioLinea - precioRenglon) < 0.001;
}

function emparejarConHijas<L extends LineaFiltrable>(
  lineas: readonly L[],
  hijas: readonly OrdenTrabajoHija[],
): Map<number, string> {
  const renglones = hijas.flatMap((hija) => hija.renglones);
  const otPorRenglon = hijas.flatMap((hija) => hija.renglones.map(() => hija.id));
  const pares = emparejarLineasConRenglones(lineas, renglones, puntajeEmparejamiento);
  const otPorLinea = new Map<number, string>();
  for (const [indiceLinea, indiceRenglon] of pares) {
    otPorLinea.set(indiceLinea, otPorRenglon[indiceRenglon]!);
  }
  return otPorLinea;
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

  const pares = emparejarLineasConRenglones(
    allLineItems,
    hija.renglones,
    puntajeEmparejamiento,
  );
  const matched = [...pares.entries()]
    .sort((izq, der) => izq[1] - der[1])
    .map(([indiceLinea]) => allLineItems[indiceLinea]!);

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
  for (const [indiceLinea, otId] of emparejarConHijas(lineas, hijas)) {
    result.set(lineas[indiceLinea]!.id_linea_orden_venta, otId);
  }
  return result;
}

type LineaFormOt = {
  nombre: string;
  codigo: string;
  cantidadInput: string;
  aliasCliente?: string | null;
  precioUnitario?: number | string | null;
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

  const wrapped = lineas.map((linea) => ({
    cantidad_pedida: parseCantidad(linea.cantidadInput),
    matchNombre: linea.nombre,
    matchCodigo: linea.codigo,
    matchTextoCliente: linea.aliasCliente ?? null,
    precio_unitario: linea.precioUnitario ?? null,
    producto: {
      sku: normalizeMatchCodigo(linea.codigo) || null,
      descripcion: linea.nombre,
      metadatos_catalogo: null,
    },
  }));
  const otByIndex = emparejarConHijas(wrapped, hijas);

  return lineas.map((linea, index) => ({
    ...linea,
    otId: otByIndex.get(index) ?? linea.otId,
  }));
}

/** REQ-176: OCC PDF/detalle — 1 OT cabecera; multi-OT numeroPedido hija. */
export function resolveNumeroOrdenClientePrint(input: {
  ordenCompraHotel?: string | null;
  hijaNumeroPedido?: string | null;
  capturaOrdenCompra?: string | null;
  tareaTotal: number;
}): string {
  const ovOcc = input.ordenCompraHotel?.trim() || "";
  const otOcc = input.hijaNumeroPedido?.trim() || "";
  const capturaOcc = input.capturaOrdenCompra?.trim() || "";
  if (input.tareaTotal > 1) return otOcc || ovOcc || capturaOcc;
  return ovOcc || otOcc || capturaOcc;
}
