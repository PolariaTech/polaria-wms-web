import type { OrdenVentaOperadorRow } from "../types/sales.types";

type FilaConBloqueoEdicion = {
  edit_locked_by?: string | null;
  edit_locked_at?: string | null;
  edit_locked_nombre?: string | null;
};

/**
 * Campos del listado de órdenes que no salen del cálculo de la fila: el posible
 * duplicado y el correo partido empiezan en «no» (se anotan después) y el
 * bloqueo de edición (REQ-180) viene de las columnas `edit_locked_*`.
 */
export function camposInicialesFilaOperador(
  row: FilaConBloqueoEdicion,
): Pick<
  OrdenVentaOperadorRow,
  | "potencialDuplicado"
  | "potencialDuplicadoDe"
  | "correoPartido"
  | "correoPartidoDe"
  | "editLockedBy"
  | "editLockedAt"
  | "editLockedNombre"
> {
  return {
    potencialDuplicado: false,
    potencialDuplicadoDe: [],
    correoPartido: false,
    correoPartidoDe: [],
    editLockedBy: row.edit_locked_by ?? null,
    editLockedAt: row.edit_locked_at ?? null,
    editLockedNombre: row.edit_locked_nombre ?? null,
  };
}
