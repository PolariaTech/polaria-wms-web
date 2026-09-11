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
  idBodega: string;
  idBodegaDestino: string | null;
}

export const UNIDAD_MEDIDA_VENTA_DEFAULT = "kg" as const;

export interface ProductoVentaOption {
  idProducto: string;
  label: string;
  idCliente: string | null;
  idBodega: string;
  codigo: string;
  nombre: string;
  /** Nombre con el que este comprador conoce el producto (si tiene equivalencia). */
  equivalencia?: string | null;
  kgDisponible: number;
  precioUnitario: number;
  /** Unidad de venta del catálogo (`producto.unidad_medida`). */
  unidadMedida: string;
}

export interface OrdenVentaLineaInput {
  idProducto: string;
  cantidadPedida: number;
  idBodega?: string | null;
  precioUnitario?: number | null;
  cajas?: number | null;
  presentacion?: string | null;
}

export interface OrdenVentaLineaRow {
  id_linea_orden_venta: string;
  id_producto: string;
  cantidad_pedida: number;
  precio_unitario: number;
  cajas?: number | null;
  presentacion?: string | null;
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
  /** Columnas flat de captura (migración 070); pueden venir vacías. */
  prioridad?: string | null;
  orden_compra_hotel?: string | null;
  centro_consumo?: string | null;
  vendedor?: string | null;
  moneda?: string | null;
  bodega_destino_label?: string | null;
  direccion_entrega?: string | null;
  anden?: string | null;
  contacto_entrega?: string | null;
  telefono_contacto?: string | null;
  turno?: string | null;
  hora_salida?: string | null;
  chofer?: string | null;
  unidad?: string | null;
  notas_lineas?: string | null;
  notas_almacen?: string | null;
  fecha_entrega?: string | null;
  ventana_desde?: string | null;
  ventana_hasta?: string | null;
  acepta_sustituciones?: string | null;
  requiere_lote?: string | null;
  registrar_temperatura?: string | null;
  origen_texto?: string | null;
  origen_archivos?: string | null;
}

export interface CreateOrdenVentaInput {
  codigoCuenta: string;
  idBodega?: string | null;
  idBodegaDestino: string;
  idComprador: string;
  lineas?: OrdenVentaLineaInput[];
  /** @deprecated Usar `lineas`. Se mantiene por compatibilidad. */
  idProducto?: string;
  /** @deprecated Usar `lineas`. */
  cantidadPedida?: number;
  observaciones?: string | null;
  idCreador?: string | null;

  // Campos de captura (para guardar directo en columnas).
  fechaEntrega?: string;
  ventanaDesde?: string;
  ventanaHasta?: string;
  prioridad?: string;
  ordenCompraHotel?: string;
  centroConsumo?: string;
  vendedor?: string;
  moneda?: string;
  bodegaDestinoLabel?: string;
  direccionEntrega?: string;
  anden?: string;
  contacto?: string;
  telefono?: string;
  turno?: string;
  horaSalida?: string;
  chofer?: string;
  unidad?: string;
  aceptaSustituciones?: string;
  requiereLote?: string;
  registrarTemperatura?: string;
  origenTexto?: string;
  origenArchivos?: readonly string[];
  notasLineas?: string;
  notasAlmacen?: string;
}

export interface UpdateOrdenVentaInput extends CreateOrdenVentaInput {
  idOrdenVenta: string;
}
