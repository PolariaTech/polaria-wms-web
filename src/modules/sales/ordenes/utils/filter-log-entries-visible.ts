import type { OrdenVentaLogEntry } from "../types/orden-venta-log.types";

/**
 * Eventos del movimiento "enviado a bodega / emitido".
 * Se ocultan del panel Log (preview e historial) para no duplicar
 * lo que ya se ve en el estado de la OV.
 */
export function isLogEventoEnvioBodega(entry: Pick<OrdenVentaLogEntry, "mensaje">): boolean {
  const mensaje = entry.mensaje.trim().toLowerCase();
  return (
    mensaje.includes("pedido enviado a bodega") ||
    /^pedido emitido por\b/.test(mensaje)
  );
}

/** Quita del listado visible solo los eventos de envío a bodega. */
export function filterLogEntriesVisible(
  entries: OrdenVentaLogEntry[],
): OrdenVentaLogEntry[] {
  return entries.filter((entry) => !isLogEventoEnvioBodega(entry));
}
