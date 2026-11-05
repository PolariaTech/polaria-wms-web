/** REQ-225: etiqueta de UI para la hija (antes «OT» / «Pedido OT»). */
export const ETIQUETA_TAREA = "TAREA";

export function etiquetaTareaIndice(indice1Based: number, total?: number): string {
  if (total != null && total > 0) {
    return `${ETIQUETA_TAREA} ${indice1Based}/${total}`;
  }
  return `${ETIQUETA_TAREA} ${indice1Based}`;
}
