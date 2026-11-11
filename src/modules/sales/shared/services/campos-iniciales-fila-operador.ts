import type { OrdenVentaOperadorRow } from "../types/sales.types";

type FilaConBloqueoEdicion = {
  edit_locked_by?: string | null;
  edit_locked_at?: string | null;
  edit_locked_nombre?: string | null;
};

/**
 * Campos del listado de órdenes que no salen del cálculo de la fila: el posible
 * duplicado empieza en «no» (se anota después con `annotatePotencialDuplicadoOv`)
 * y el bloqueo de edición (REQ-180) viene de las columnas `edit_locked_*`.
 */
export function camposInicialesFilaOperador(
  row: FilaConBloqueoEdicion,
): Pick<
  OrdenVentaOperadorRow,
  | "potencialDuplicado"
  | "potencialDuplicadoDe"
  | "editLockedBy"
  | "editLockedAt"
  | "editLockedNombre"
> {
  return {
    potencialDuplicado: false,
    potencialDuplicadoDe: [],
    editLockedBy: row.edit_locked_by ?? null,
    editLockedAt: row.edit_locked_at ?? null,
    editLockedNombre: row.edit_locked_nombre ?? null,
  };
}
