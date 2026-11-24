import { decodeProveedorRazonSocial } from "@/modules/admin-panel";
import type {
  OrdenCompraLineaRow,
  OrdenCompraRow,
  SolicitudCompraLineaRow,
  SolicitudCompraRow,
} from "../../shared/types/purchases.types";

export const SOLICITUD_COLUMNS =
  "id_solicitud_compra,codigo_cuenta,id_bodega,id_proveedor,id_orden_compra,codigo,estado,id_solicitante,observaciones,created_at,updated_at," +
  "solicitud_compra_linea(id_linea_solicitud_compra,id_producto,cantidad,producto(sku,descripcion,codigo_almacen))";

export const ORDEN_COLUMNS =
  "id_orden_compra,codigo_cuenta,id_bodega,id_proveedor,id_solicitud_compra,id_creador,codigo,estado,fecha_emision,fecha_entrega_estimada,destino_tipo,observaciones,created_at,updated_at," +
  "proveedor(razon_social)," +
  "orden_compra_linea(id_linea_orden_compra,id_producto,cantidad,cantidad_recibida,producto(sku,descripcion,metadatos_catalogo))";

export const RECEPCION_COLUMNS =
  "id_recepcion,codigo_cuenta,id_bodega,id_orden_compra,sin_diferencias,notas,cerrada_at,cerrada_por,created_at";

export const ORDEN_LINEA_COLUMNS = "cantidad,producto(sku,unidad_medida)";

export const ORDEN_LINEA_RECEPCION_COLUMNS =
  "id_linea_orden_compra,id_producto,cantidad,cantidad_recibida,producto(sku,descripcion,metadatos_catalogo)";

export interface OrdenCompraNotifyLineaRow {
  sku: string;
  cantidad: number;
  unidad: string;
}

export interface OrdenCompraLineaListDbRow {
  id_linea_orden_compra: string;
  id_producto: string;
  cantidad: string | number;
  cantidad_recibida?: string | number | null;
  producto:
    | {
        sku: string | null;
        descripcion: string | null;
        metadatos_catalogo?: unknown;
      }
    | {
        sku: string | null;
        descripcion: string | null;
        metadatos_catalogo?: unknown;
      }[]
    | null;
}

export interface OrdenCompraDbRow
  extends Omit<OrdenCompraRow, "lineas" | "proveedor_nombre"> {
  proveedor:
    | { razon_social: string | null }
    | { razon_social: string | null }[]
    | null;
  orden_compra_linea: OrdenCompraLineaListDbRow[] | null;
}

export interface OrdenCompraLineaNotifyDbRow {
  cantidad: string | number;
  producto:
    | { sku: string; unidad_medida: string | null }
    | { sku: string; unidad_medida: string | null }[]
    | null;
}

function resolveProducto(
  producto: OrdenCompraLineaNotifyDbRow["producto"],
): { sku: string; unidad_medida: string | null } | null {
  if (!producto) return null;
  return Array.isArray(producto) ? (producto[0] ?? null) : producto;
}

function resolveProveedorNombre(
  proveedor: OrdenCompraDbRow["proveedor"],
): string | null {
  const row = Array.isArray(proveedor) ? (proveedor[0] ?? null) : proveedor;
  const razonSocial = row?.razon_social?.trim();
  if (!razonSocial) {
    return null;
  }

  const { proveedor: nombre, nombre: contacto } =
    decodeProveedorRazonSocial(razonSocial);

  if (contacto && contacto !== nombre) {
    return `${nombre} — ${contacto}`;
  }

  return nombre || contacto || razonSocial;
}

function resolveOrdenLineaProducto(
  producto: OrdenCompraLineaListDbRow["producto"],
): OrdenCompraLineaRow["producto"] {
  if (!producto) {
    return null;
  }

  return Array.isArray(producto) ? (producto[0] ?? null) : producto;
}

export function mapOrdenCompraLineaListRow(
  row: OrdenCompraLineaListDbRow,
): OrdenCompraLineaRow {
  return {
    id_linea_orden_compra: row.id_linea_orden_compra,
    id_producto: row.id_producto,
    cantidad: Number(row.cantidad),
    cantidad_recibida:
      row.cantidad_recibida != null ? Number(row.cantidad_recibida) : 0,
    producto: resolveOrdenLineaProducto(row.producto),
  };
}

export function mapOrdenCompraRow(row: OrdenCompraDbRow): OrdenCompraRow {
  const { proveedor, orden_compra_linea, ...orden } = row;

  return {
    ...orden,
    proveedor_nombre: resolveProveedorNombre(proveedor),
    lineas: (orden_compra_linea ?? []).map(mapOrdenCompraLineaListRow),
  };
}

export function mapOrdenCompraLineaNotifyRow(
  row: OrdenCompraLineaNotifyDbRow,
): OrdenCompraNotifyLineaRow | null {
  const producto = resolveProducto(row.producto);
  const sku = producto?.sku?.trim() ?? "";
  const cantidad = Number(row.cantidad);
  const unidad = producto?.unidad_medida?.trim() || "und";

  if (!sku || !Number.isFinite(cantidad) || cantidad <= 0) {
    return null;
  }

  return { sku, cantidad, unidad };
}

export interface SolicitudCompraLineaDbRow {
  id_linea_solicitud_compra: string;
  id_producto: string;
  cantidad: string | number;
  producto:
    | {
        sku: string | null;
        descripcion: string | null;
        codigo_almacen: string | null;
      }
    | {
        sku: string | null;
        descripcion: string | null;
        codigo_almacen: string | null;
      }[]
    | null;
}

export interface SolicitudCompraDbRow extends Omit<SolicitudCompraRow, "lineas"> {
  solicitud_compra_linea: SolicitudCompraLineaDbRow[] | null;
}

function resolveLineaProducto(
  producto: SolicitudCompraLineaDbRow["producto"],
): SolicitudCompraLineaRow["producto"] {
  if (!producto) {
    return null;
  }

  return Array.isArray(producto) ? (producto[0] ?? null) : producto;
}

export function mapSolicitudCompraLineaRow(
  row: SolicitudCompraLineaDbRow,
): SolicitudCompraLineaRow {
  return {
    id_linea_solicitud_compra: row.id_linea_solicitud_compra,
    id_producto: row.id_producto,
    cantidad: Number(row.cantidad),
    producto: resolveLineaProducto(row.producto),
  };
}

export function mapSolicitudCompraRow(row: SolicitudCompraDbRow): SolicitudCompraRow {
  const { solicitud_compra_linea, ...solicitud } = row;

  return {
    ...solicitud,
    lineas: (solicitud_compra_linea ?? []).map(mapSolicitudCompraLineaRow),
  };
}