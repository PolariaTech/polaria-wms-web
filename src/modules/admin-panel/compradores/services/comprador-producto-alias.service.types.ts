import { listCatalogoProductosAdmin, listPreciosProductoVigentesAdmin, type CatalogoProductoListRow } from "@/modules/admin-panel/catalogo/services/productos-catalogo.service";

export const ALIAS_LIST_LIMIT = 500;
export const ALIAS_CUENTA_LIST_LIMIT = 5000;
export const CATALOGO_JOIN_LIMIT = 500;
export const CATALOGO_TEMPLATE_LIMIT = 5000;

export interface CompradorProductoAliasRow {
  idAlias: string;
  idComprador: string;
  idProducto: string;
  alias: string;
  /** Precio especial del comprador; null = usar lista de precios. */
  precioOverride: number | null;
}

export interface CompradorProductoAliasListRow extends CompradorProductoAliasRow {
  codigoProducto: string;
  nombreProducto: string;
  /** Precio efectivo: override del comprador o lista default. */
  precio: number | null;
  /** Precio vigente en lista de precios (precio_producto). */
  precioLista: number | null;
  unidad: string;
}

export interface CompradorProductoAliasDbRow {
  id_alias: string;
  id_comprador: string;
  id_producto: string;
  alias: string;
  precio: string | number | null;
  comprador?:
    | { codigo: string | null; nombre: string | null }
    | { codigo: string | null; nombre: string | null }[]
    | null;
}

export const ALIAS_COLUMNS = "id_alias,id_comprador,id_producto,alias,precio";
export const ALIAS_CUENTA_COLUMNS = `${ALIAS_COLUMNS},comprador(codigo,nombre)`;

export function parsePrecioOverride(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapAliasRow(row: CompradorProductoAliasDbRow): CompradorProductoAliasRow {
  return {
    idAlias: row.id_alias,
    idComprador: row.id_comprador,
    idProducto: row.id_producto,
    alias: row.alias,
    precioOverride: parsePrecioOverride(row.precio),
  };
}

export function nestedComprador(
  row: CompradorProductoAliasDbRow,
): { codigo: string; nombre: string } | null {
  const value = Array.isArray(row.comprador)
    ? row.comprador[0]
    : row.comprador;
  if (!value) return null;

  const codigo = value.codigo?.trim() ?? "";
  const nombre = value.nombre?.trim() ?? "";
  if (!codigo && !nombre) return null;

  return { codigo, nombre };
}

export interface ListCompradorProductoAliasParams {
  codigoCuenta: string;
  idComprador: string;
}

export interface CompradorProductoAliasCuentaRow
  extends CompradorProductoAliasListRow {
  codigoComprador: string;
  nombreComprador: string;
}

export function toAliasListRow(
  row: CompradorProductoAliasDbRow,
  productoById: Map<string, CatalogoProductoListRow>,
  precioByProductoId: Record<string, number | null | undefined>,
): CompradorProductoAliasListRow {
  const mapped = mapAliasRow(row);
  const producto = productoById.get(row.id_producto);
  const precioListaRaw = precioByProductoId[row.id_producto];
  const precioLista =
    precioListaRaw !== undefined && precioListaRaw !== null
      ? precioListaRaw
      : null;

  return {
    ...mapped,
    codigoProducto: producto?.codigo ?? "—",
    nombreProducto: producto?.titulo ?? "—",
    unidad: producto?.unidad?.trim() || "—",
    precioLista,
    precio: mapped.precioOverride ?? precioLista,
  };
}

export async function loadAliasProductoContext(
  codigoCuenta: string,
  aliasRows: CompradorProductoAliasDbRow[],
): Promise<{
  productoById: Map<string, CatalogoProductoListRow>;
  precioByProductoId: Record<string, number | null | undefined>;
}> {
  if (aliasRows.length === 0) {
    return {
      productoById: new Map(),
      precioByProductoId: {},
    };
  }

  const productoIds = [
    ...new Set(aliasRows.map((row) => row.id_producto).filter(Boolean)),
  ];

  const [productos, precioByProductoId] = await Promise.all([
    listCatalogoProductosAdmin({
      codigoCuenta,
      limit: Math.max(CATALOGO_JOIN_LIMIT, productoIds.length),
    }),
    listPreciosProductoVigentesAdmin({
      codigoCuenta,
      idProductos: productoIds,
    }),
  ]);

  return {
    productoById: new Map(
      productos.map((row) => [row.idProducto, row] as const),
    ),
    precioByProductoId,
  };
}

/**
 * Lista equivalencias del comprador.
 * El precio mostrado es el override del comprador o, si no hay, la lista default.
 */
