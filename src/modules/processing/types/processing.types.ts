export type EstadoProcesamiento =
  | "borrador"
  | "pendiente"
  | "en_proceso"
  | "pendiente_cierre"
  | "terminada"
  | "cancelada";

export type EstadoTarea =
  | "pendiente"
  | "en_proceso"
  | "completada"
  | "cancelada";

export type TipoTarea =
  | "ingreso"
  | "movimiento"
  | "despacho"
  | "procesamiento"
  | "revision"
  | "otro";

export interface SolicitudProcesamientoRow {
  id_solicitud_procesamiento: string;
  codigo_cuenta: string;
  id_bodega: string;
  codigo: string;
  id_cliente: string | null;
  id_producto_primario: string;
  id_producto_secundario: string;
  id_solicitante: string;
  id_procesador: string | null;
  estado: EstadoProcesamiento;
  kilos_primario: string;
  kilos_secundario: string | null;
  kilos_merma: string | null;
  created_at: string;
  updated_at: string;
}

export interface TareaColaRow {
  id_tarea: string;
  codigo_cuenta: string;
  id_bodega: string;
  tipo: TipoTarea;
  estado: EstadoTarea;
  id_asignado: string | null;
  id_orden_trabajo: string | null;
  titulo: string | null;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}
