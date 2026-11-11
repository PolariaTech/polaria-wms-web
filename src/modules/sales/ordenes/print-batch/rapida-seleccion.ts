import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { diaEntregaDeOv, totalOtDeOv, type ResumenOvBatch } from "./batch-seleccion";

/**
 * Regla de la Impresión rápida (daily del 2026-11-05): el orden es estricto y distinto al de la
 * detallada. Primero la fecha de entrega de la más antigua a la más nueva, luego la cantidad de
 * órdenes de tarea de menor a mayor y al final el cliente en orden alfabético.
 */
export function ordenarOvRapida(
  rows: readonly OrdenVentaOperadorRow[],
): OrdenVentaOperadorRow[] {
  return rows
    .map((row, indice) => ({ row, indice, dia: diaEntregaDeOv(row), ot: totalOtDeOv(row) }))
    .sort(
      (a, b) =>
        (a.dia < b.dia ? -1 : a.dia > b.dia ? 1 : 0) ||
        a.ot - b.ot ||
        a.row.comprador.localeCompare(b.row.comprador, "es") ||
        a.indice - b.indice,
    )
    .map((item) => item.row);
}

/**
 * OV candidatas: solo las «confirmada» (todavía sin nada llenado en bodega; en cuanto pasan a
 * alistamiento ya hay surtido), con fecha de entrega exactamente la elegida (ni antes ni
 * después). Una OV sin fecha de entrega no se puede ubicar en el tiempo y no entra: se
 * imprime a mano desde la detallada, que también cubre el alistamiento.
 */
export function candidatasRapida(
  rows: readonly OrdenVentaOperadorRow[],
  fechaExacta: string,
): OrdenVentaOperadorRow[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaExacta)) return [];
  return rows.filter((row) => {
    const dia = diaEntregaDeOv(row);
    return row.estado === "confirmada" && dia === fechaExacta;
  });
}

/** Las OV por imprimir, ya sin las que se imprimieron antes, ordenadas y con todas sus OT. */
export function resumenRapida(
  candidatas: readonly OrdenVentaOperadorRow[],
  yaImpresas: ReadonlySet<string>,
): ResumenOvBatch[] {
  const pendientes = candidatas.filter((row) => !yaImpresas.has(row.idOrdenVenta));
  return ordenarOvRapida(pendientes).map((row) => ({
    row,
    ots: Array.from({ length: totalOtDeOv(row) }, (_, i) => i + 1),
  }));
}
