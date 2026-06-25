export type TipoAuditoria =
  | "creacion"
  | "actualizacion"
  | "eliminacion"
  | "cambio_estado"
  | "movimiento_inventario"
  | "acceso_denegado";

export interface AuditoriaOperacionRow {
  id_auditoria: string;
  codigo_cuenta: string;
  id_bodega: string | null;
  id_usuario: string | null;
  accion: TipoAuditoria;
  entidad: string;
  entidad_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}
