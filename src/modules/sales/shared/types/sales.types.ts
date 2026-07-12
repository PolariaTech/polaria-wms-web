export type EstadoOrdenVenta =
  | "borrador"
  | "confirmada"
  | "en_preparacion"
  | "parcialmente_despachada"
  | "despachada"
  | "cerrada"
  | "cancelada";

export interface OrdenVentaRow {
  id_orden_venta: string;
  codigo_cuenta: string;
  id_bodega: string;
  id_cliente: string;
  id_comprador: string | null;
  id_planta: string | null;
  id_creador: string | null;
  id_bodega_destino: string | null;
  codigo: string;
  estado: EstadoOrdenVenta;
  fecha_pedido: string;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrdenVentaOperadorRow {
  idOrdenVenta: string;
  venta: string;
  cuenta: string;
  comprador: string;
  productos: string;
  cantidadKg: number;
  total: number;
  estado: EstadoOrdenVenta;
  fecha: string;
  destino: string;
}

export interface ProductoVentaOption {
  idProducto: string;
  label: string;
  idCliente: string | null;
  idBodega: string;
  codigo: string;
  nombre: string;
  kgDisponible: number;
  precioUnitario: number;
}

export interface OrdenVentaLineaInput {
  idProducto: string;
  cantidadPedida: number;
  idBodega?: string | null;
}

export interface OrdenVentaLineaRow {
  id_linea_orden_venta: string;
  id_producto: string;
  cantidad_pedida: number;
  precio_unitario: number;
  producto: {
    sku: string | null;
    descripcion: string | null;
    metadatos_catalogo?: unknown;
  } | null;
}

export interface OrdenVentaDetalleRow extends OrdenVentaRow {
  comprador_nombre: string | null;
  comprador_codigo: string | null;
  bodega_nombre: string | null;
  bodega_destino_nombre: string | null;
  lineas: OrdenVentaLineaRow[];
}

export interface CreateOrdenVentaInput {
  codigoCuenta: string;
  idBodega?: string | null;
  idComprador: string;
  lineas?: OrdenVentaLineaInput[];
  /** @deprecated Usar `lineas`. Se mantiene por compatibilidad. */
  idProducto?: string;
  /** @deprecated Usar `lineas`. */
  cantidadPedida?: number;
  observaciones?: string | null;
  idCreador?: string | null;
}
