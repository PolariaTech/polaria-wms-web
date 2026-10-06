import type { EstadoOrdenVenta } from "../../shared/types/sales.types";

/**
 * Calcula el estado de alistamiento según cuántas OT hijas ya tienen foto.
 * - 0 fotos → null (no cambia)
 * - Al menos 1 pero no todas → alistamiento
 * - Todas (o 1 sola hoja) → alistada
 */
export function computeEstadoAlistamientoFromCapturas(params: {
  totalOrdenesTrabajo: number;
  ordenesTrabajoConFoto: number;
}): "alistamiento" | "alistada" | null {
  const total = Math.max(0, params.totalOrdenesTrabajo);
  const conFoto = Math.max(0, params.ordenesTrabajoConFoto);
  if (conFoto <= 0) return null;

  // Sin hijas explícitas o una sola hoja: la primera foto completa el alistado.
  if (total <= 1) return "alistada";

  if (conFoto >= total) return "alistada";
  return "alistamiento";
}

const ESTADOS_QUE_ACEPTAN_ALISTAMIENTO: ReadonlySet<string> = new Set([
  "confirmada",
  "alistamiento",
  "alistada",
]);

/** Solo avanza confirmada → alistamiento → alistada; no pisa despacho/cierre. */
export function puedeAplicarEstadoAlistamiento(
  estadoActual: string,
): estadoActual is
  | "confirmada"
  | "alistamiento"
  | "alistada"
  | EstadoOrdenVenta {
  return ESTADOS_QUE_ACEPTAN_ALISTAMIENTO.has(estadoActual);
}
