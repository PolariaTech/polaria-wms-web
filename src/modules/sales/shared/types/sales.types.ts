import type { OrigenCorreoRenglon } from "@/modules/sales/ordenes/utils/origen-correo-ordenes-trabajo";

/** Estados de negocio de OV (solo estos cuatro). */
export type EstadoOrdenVenta =
  | "por_confirmar"
  | "confirmada"
  | "alistamiento"
  | "alistada";

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
  /** Primera OCC visible en tabla. */
  occ: string;
  /**
   * Todas las OCC de la OV (primera + resto).
   * En tabla se muestra la primera y un "+" si hay más; alimentan el buscador.
   */
  occTodas: string[];
  cuenta: string;
  comprador: string;
  productos: string;
  cantidadKg: number;
  total: number;
  estado: EstadoOrdenVenta;
  fecha: string;
  /** Cantidad de órdenes de trabajo (OT) de la OV. */
  ordenesTrabajo: number;
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

/** Snapshot de matching Mateo ↔ catálogo (persistido en orden_venta_linea.match_producto). */
export interface MatchProductoRef {
  idProducto: string | null;
  nombre: string;
  codigo: string;
}

export interface MatchProductoLinea {
  textoCliente: string;
  sugeridoMateo: MatchProductoRef | null;
  elegidoUsuario: MatchProductoRef;
}

export interface OrdenVentaLineaInput {
  idProducto: string;
  cantidadPedida: number;
  idBodega?: string | null;
  precioUnitario?: number | null;
  cajas?: number | null;
  presentacion?: string | null;
  /** Auditoría: texto cliente, sugerencia Mateo y elección del usuario. */
  matchProducto?: MatchProductoLinea | null;
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
  origen_correo?: unknown;
}

export interface CreateOrdenVentaInput {
  codigoCuenta: string;
  idBodega?: string | null;
  idBodegaDestino?: string | null;
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
  /** Renglones estructurados del correo (órdenes de trabajo hijas). */
  origenCorreo?: readonly OrigenCorreoRenglon[];
  notasLineas?: string;
  notasAlmacen?: string;
}

export interface UpdateOrdenVentaInput extends CreateOrdenVentaInput {
  idOrdenVenta: string;
}
