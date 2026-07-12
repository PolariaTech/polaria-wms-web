import type { OrdenTrabajoApiRow } from "@/modules/operations";

const ORDEN_TRABAJO_ESTADOS_TERMINALES = new Set([
  "completada",
  "completado",
  "cerrada",
  "cerrado",
  "cancelada",
  "cancelado",
  "finalizada",
  "finalizado",
  "ejecutada",
  "ejecutado",
  "anulada",
  "anulado",
]);

export function isOrdenTrabajoSalidaEjecutada(orden: {
  estado: string;
  tipoFlujo?: string | null;
  idUbicacionDestino?: string | null;
}): boolean {
  const estado = orden.estado?.trim().toLowerCase();
  if (!estado || !ORDEN_TRABAJO_ESTADOS_TERMINALES.has(estado)) {
    return false;
  }

  if (!orden.idUbicacionDestino?.trim()) return false;

  if (orden.tipoFlujo) {
    return orden.tipoFlujo === "a_salida";
  }

  return true;
}

export function countOrdenesTrabajoSalidaEjecutadas(
  ordenes: OrdenTrabajoApiRow[],
): number {
  return ordenes.filter(isOrdenTrabajoSalidaEjecutada).length;
}
