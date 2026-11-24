import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type {
  OrdenVentaLineaRow,
  OrdenVentaRow,
} from "../types/sales.types";
import { ORDEN_VENTA_DETALLE_FLAT_COLUMNS } from "./orden-venta-detalle-columns";

/** PostgREST GET `.in()` explota la URL con ~1000 UUIDs; tandas cortas evitan 400. */
export const ORDEN_VENTA_LINEA_IN_CHUNK = 80;

export const ORDEN_VENTA_COLUMNS =
  "id_orden_venta,codigo_cuenta,id_bodega,id_cliente,id_comprador,id_planta,id_creador,id_bodega_destino,codigo,estado,fecha_pedido,observaciones,created_at,updated_at,estado_desde,edit_locked_by,edit_locked_at,edit_locked_nombre";

/** Listado operador: OCC, origen (correo/archivos) y fecha de entrega. */
export const ORDEN_VENTA_OPERADOR_LIST_COLUMNS =
  `${ORDEN_VENTA_COLUMNS},orden_compra_hotel,origen_correo,origen_archivos,fecha_entrega`;

export type OrdenVentaOperadorListRow = OrdenVentaRow & {
  orden_compra_hotel?: string | null;
  origen_correo?: unknown;
  origen_archivos?: string | null;
  fecha_entrega?: string | null;
};

export const COMPRADOR_COLUMNS = "id_comprador,nombre";

export const ORDEN_VENTA_DETALLE_SELECT =
  `${ORDEN_VENTA_COLUMNS},${ORDEN_VENTA_DETALLE_FLAT_COLUMNS},` +
  "comprador:comprador(nombre,codigo,razon_social,apodo,rfc,denominacion_comercial_override)," +
  "orden_venta_linea(id_linea_orden_venta,id_producto,cantidad_pedida,precio_unitario,cajas,presentacion,unidad_medida,match_producto,producto(sku,descripcion,metadatos_catalogo))";

export interface OrdenVentaLineaDetalleDbRow {
  id_linea_orden_venta: string;
  id_producto: string;
  cantidad_pedida: string | number;
  precio_unitario: string | number;
  cajas?: string | number | null;
  presentacion?: string | null;
  unidad_medida?: string | null;
  match_producto?: OrdenVentaLineaRow["match_producto"];
  producto:
    | OrdenVentaLineaRow["producto"]
    | NonNullable<OrdenVentaLineaRow["producto"]>[]
    | null;
}

export interface CompradorDetalleDbRel {
  nombre: string | null;
  codigo: string | null;
  razon_social?: string | null;
  apodo?: string | null; rfc?: string | null; denominacion_comercial_override?: string | null;
}

export interface OrdenVentaDetalleDbRow extends OrdenVentaRow {
  comprador: CompradorDetalleDbRel | CompradorDetalleDbRel[] | null;
  orden_venta_linea: OrdenVentaLineaDetalleDbRow[] | null;
  origen_texto?: string | null;
  origen_archivos?: string | null;
  origen_correo?: unknown; denominacion_comercial_override?: string | null;
}

export const WAREHOUSE_STOCK_VENTA_SELECT =
  "id_producto,id_bodega,id_ubicacion,cantidad,cantidad_reservada," +
  "producto:producto(id_producto,sku,descripcion,id_cliente,metadatos_catalogo)";

export const UBICACION_VENTA_SELECT =
  "id_ubicacion,id_bodega,tipo_ubicacion(codigo,es_recepcion,es_almacenamiento,es_picking)";

export interface CompradorDbRow {
  id_comprador: string;
  nombre: string;
}

export interface BodegaDestinoDbRow {
  id_bodega: string;
  nombre: string;
}

export interface OrdenVentaLineaDbRow {
  id_orden_venta: string;
  id_producto: string;
  cantidad_pedida: string | number;
  precio_unitario: string | number;
}

export const ORDEN_VENTA_LINEA_COLUMNS =
  "id_orden_venta,id_producto,cantidad_pedida,precio_unitario";

export interface OrdenVentaLineasResumen {
  count: number;
  cantidadKg: number;
  total: number;
}

export interface WarehouseStockVentaRow {
  id_producto: string;
  id_bodega: string;
  id_ubicacion: string;
  cantidad: string | number;
  cantidad_reservada: string | number;
  producto: WarehouseStateRow["producto"];
}

export interface StockVentaProductoAgg {
  kgDisponible: number;
  sampleRow: WarehouseStockVentaRow;
}

/** Más reciente primero (fecha de creación); id como desempate estable. */
export function sortOrdenesVentaPorCreacionDesc(
  rows: OrdenVentaRow[],
): OrdenVentaRow[] {
  return [...rows].sort((a, b) => {
    const ta = Date.parse(a.created_at || a.fecha_pedido) || 0;
    const tb = Date.parse(b.created_at || b.fecha_pedido) || 0;
    if (tb !== ta) return tb - ta;
    return b.id_orden_venta.localeCompare(a.id_orden_venta);
  });
}

export function parseCantidadKg(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
