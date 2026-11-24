import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";

export const tarea = (
  overrides: Partial<TareaColaRow> & Pick<TareaColaRow, "id_tarea">,
): TareaColaRow => ({
  codigo_cuenta: "ACME",
  id_bodega: "b1",
  tipo: "movimiento",
  estado: "pendiente",
  id_asignado: "op-1",
  id_orden_trabajo: "ord-1",
  id_solicitud_procesamiento: null,
  titulo: "A bodega · OT-000001",
  descripcion: null,
  created_at: "2026-07-09T12:00:00.000Z",
  updated_at: "2026-07-09T12:00:00.000Z",
  ...overrides,
});
