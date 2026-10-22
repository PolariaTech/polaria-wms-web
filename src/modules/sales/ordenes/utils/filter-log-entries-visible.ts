import type { OrdenVentaLogEntry } from "../types/orden-venta-log.types";

/**
 * Antes se ocultaban los «enviado a bodega / emitido».
 * Ahora la bitácora muestra todos los movimientos de la OT/OV.
 */
export function isLogEventoEnvioBodega(
  entry: Pick<OrdenVentaLogEntry, "mensaje">,
): boolean {
  const mensaje = entry.mensaje.trim().toLowerCase();
  return (
    mensaje.includes("pedido enviado a bodega") ||
    /^pedido emitido por\b/.test(mensaje)
  );
}

/** Identidad: todos los eventos son visibles en bitácora. */
export function filterLogEntriesVisible(
  entries: OrdenVentaLogEntry[],
): OrdenVentaLogEntry[] {
  return entries;
}
