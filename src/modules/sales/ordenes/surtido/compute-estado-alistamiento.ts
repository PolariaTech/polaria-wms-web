import type { EstadoOrdenVenta } from "../../shared/types/sales.types";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

/**
 * Calcula el estado de alistamiento:
 * - 0 fotos → null (no cambia)
 * - Hay foto pero faltan chulos Alistó en líneas → alistamiento
 * - Todas las OT con foto y Alistó completo en sus líneas → alistada
 */
export function computeEstadoAlistamientoFromCapturas(params: {
  totalOrdenesTrabajo: number;
  ordenesTrabajoConFoto: number;
  /** OTs cuya captura tiene alisto=true en todas las líneas de producto esperadas. */
  ordenesTrabajoConAlistoCompleto: number;
}): "alistamiento" | "alistada" | null {
  const total = Math.max(0, params.totalOrdenesTrabajo);
  const conFoto = Math.max(0, params.ordenesTrabajoConFoto);
  const conAlisto = Math.max(0, params.ordenesTrabajoConAlistoCompleto);
  if (conFoto <= 0) return null;

  // Una sola hoja / sin hijas: foto sola no basta; hace falta Alistó en todas las líneas.
  if (total <= 1) {
    return conAlisto >= 1 ? "alistada" : "alistamiento";
  }

  if (conFoto < total) return "alistamiento";
  if (conAlisto >= total) return "alistada";
  return "alistamiento";
}

/** true si cada línea esperada (1..n) tiene alisto === true en el payload. */
export function capturaTieneAlistoCompleto(
  payload: OrdenSurtidoCapturaPayload | null | undefined,
  lineasEsperadas: number,
): boolean {
  const n = Math.max(0, Math.floor(lineasEsperadas));
  if (n <= 0) return false;
  const rows = payload?.lineas ?? [];
  for (let indice = 1; indice <= n; indice += 1) {
    const row = rows.find((linea) => linea.indice === indice);
    if (row?.alisto !== true) return false;
  }
  return true;
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
