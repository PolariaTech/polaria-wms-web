import { ETIQUETA_TAREA } from "./etiqueta-tarea-ot";

/** Tooltips de iconos del pie (REQ-232 / REQ-225). */
export function tooltipEliminarTareaOt(indiceOt1Based: number): string {
  return `Eliminar esta tarea · ${ETIQUETA_TAREA} ${indiceOt1Based}`;
}

export function tooltipGuardarAvanceVenta(): string {
  return "Guardar avance de toda esta venta";
}
