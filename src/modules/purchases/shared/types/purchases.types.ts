export type EstadoSolicitudCompra =
  | "borrador"
  | "pendiente_aprobacion"
  | "aprobada"
  | "rechazada"
  | "convertida"
  | "cancelada";

export type EstadoOrdenCompra =
  | "borrador"
  | "emitida"
  | "parcialmente_recibida"
  | "recibida"
  | "cerrada"
  | "cancelada";

export interface SolicitudCompraLineaRow {
  id_linea_solicitud_compra: string;
  id_producto: string;
  cantidad: number;
  producto?: {
    sku: string | null;
    descripcion: string | null;
    codigo_almacen: string | null;
    metadatos_catalogo?: unknown;
  } | null;
}

export interface SolicitudCompraRow {
  id_solicitud_compra: string;
  codigo_cuenta: string;
  id_bodega: string;
  id_proveedor: string | null;
  id_orden_compra: string | null;
  codigo: string;
  estado: EstadoSolicitudCompra;
  id_solicitante: string;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  lineas?: SolicitudCompraLineaRow[];
}

export interface OrdenCompraLineaRow {
  id_linea_orden_compra: string;
  id_producto: string;
  cantidad: number;
  cantidad_recibida?: number;
  producto?: {
    sku: string | null;
    descripcion: string | null;
    metadatos_catalogo?: unknown;
  } | null;
}

export type DestinoTipoOrden = "interna" | "externa";

export interface OrdenCompraRow {
  id_orden_compra: string;
  codigo_cuenta: string;
  id_bodega: string;
  id_proveedor: string;
  proveedor_nombre?: string | null;
  id_solicitud_compra: string | null;
  id_creador: string | null;
  codigo: string;
  estado: EstadoOrdenCompra;
  fecha_emision: string;
  fecha_entrega_estimada: string | null;
  destino_tipo: string;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  lineas?: OrdenCompraLineaRow[];
}

export interface RecepcionCompraRow {
  id_recepcion: string;
  codigo_cuenta: string;
  id_bodega: string;
  id_orden_compra: string;
  sin_diferencias: boolean;
  notas: string | null;
  cerrada_at: string;
  cerrada_por: string;
  created_at: string;
}
