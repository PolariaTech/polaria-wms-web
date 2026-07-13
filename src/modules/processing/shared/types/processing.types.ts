export type EstadoProcesamiento =
  | "borrador"
  | "pendiente"
  | "en_proceso"
  | "pendiente_cierre"
  | "terminada"
  | "cancelada";

export type TipoTarea =
  | "ingreso"
  | "movimiento"
  | "despacho"
  | "procesamiento"
  | "revision"
  | "otro";

export type EstadoTarea =
  | "pendiente"
  | "en_proceso"
  | "completada"
  | "cancelada";

export interface SolicitudProcesamientoRow {
  id_solicitud_procesamiento: string;
  codigo_cuenta: string;
  id_bodega: string;
  codigo: string;
  id_cliente: string | null;
  id_producto_primario: string;
  id_producto_secundario: string;
  id_solicitante: string;
  id_operario: string | null;
  id_procesador: string | null;
  estado: EstadoProcesamiento;
  kilos_primario: string;
  kilos_secundario: string | null;
  kilos_merma: string | null;
  sobrante_kg: string | null;
  regla_conversion_cantidad_primario: string | null;
  regla_conversion_unidades_secundario: string | null;
  perdida_procesamiento_pct: string | null;
  estimado_unidades_secundario: string | null;
  kg_primario_descontado: string | null;
  cierre_desde_procesador: boolean;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export interface SolicitudProcesamientoOperadorRow {
  idSolicitudProcesamiento: string;
  orden: string;
  primario: string;
  secundario: string;
  insumoPrimario: string;
  estimSecundario: string;
  estado: EstadoProcesamiento;
  fecha: string;
}

export interface ProductoProcesamientoOption {
  idProducto: string;
  label: string;
  descripcion: string;
  sku: string;
  reglaConversionCantidadPrimario: number | null;
  reglaConversionUnidadesSecundario: number | null;
  mermaPct: number | null;
}

export interface CreateSolicitudProcesamientoInput {
  codigoCuenta: string;
  idBodega: string;
  idSolicitante: string;
  idProductoPrimario: string;
  idProductoSecundario: string;
  kilosPrimario: number;
  reglaConversionCantidadPrimario: number;
  reglaConversionUnidadesSecundario: number;
  estimadoUnidadesSecundario?: number;
  perdidaProcesamientoPct?: number;
  observaciones?: string;
}

export interface CreateOrdenesPostCierreInput {
  codigoCuenta: string;
  idBodega: string;
  idUbicacionDestinoProcesado?: string;
  idUbicacionDestinoDesperdicio?: string;
}

export interface OrdenesPostCierreResult {
  ordenProcesadoId: string | null;
  ordenDesperdicioId: string | null;
}

export interface TareaColaRow {
  id_tarea: string;
  codigo_cuenta: string;
  id_bodega: string;
  tipo: TipoTarea;
  estado: EstadoTarea;
  id_asignado: string | null;
  id_orden_trabajo: string | null;
  id_solicitud_procesamiento: string | null;
  titulo: string | null;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}
