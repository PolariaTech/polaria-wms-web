import type { EstadoOrdenVenta } from "../../shared/types/sales.types";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

/**
 * Calcula el estado a partir de las fotos de surtido.
 * Gana la marca más avanzada que aparezca en cualquier foto:
 * - 0 fotos → null (no cambia)
 * - Hay foto pero faltan chulos Alistó y no hay hito mayor → alistamiento
 * - Todas las OT con Alistó completo → alistada
 * - Un chulo de Revisó → revisada, aunque falte Alistó
 * - Una firma de Despachó → despachada, con o sin chulos
 * - Una firma de Factura (OK) → facturada, con o sin chulos y con o sin Despachó
 *
 * Despachado va antes que Facturado. El retroceso lo frena quien llama.
 */
export function computeEstadoAlistamientoFromCapturas(params: {
  totalOrdenesTrabajo: number;
  ordenesTrabajoConFoto: number;
  /** OTs cuya captura tiene alisto=true en todas las líneas de producto esperadas. */
  ordenesTrabajoConAlistoCompleto: number;
  /** OTs con al menos un chulo de Revisó, o con firma de revisión. */
  ordenesTrabajoConRevisoCompleto?: number;
  /** OTs con firma (o folio) en Factura (OK). Una basta. */
  ordenesTrabajoConFactura?: number;
  /** OTs con firma en la caja Despachó. Una basta. */
  ordenesTrabajoConDespacho?: number;
}): "alistamiento" | "alistada" | "revisada" | "despachada" | "facturada" | null {
  const total = Math.max(0, params.totalOrdenesTrabajo);
  const conFoto = Math.max(0, params.ordenesTrabajoConFoto);
  const conAlisto = Math.max(0, params.ordenesTrabajoConAlistoCompleto);
  const conReviso = Math.max(0, params.ordenesTrabajoConRevisoCompleto ?? 0);
  const conFactura = Math.max(0, params.ordenesTrabajoConFactura ?? 0);
  const conDespacho = Math.max(0, params.ordenesTrabajoConDespacho ?? 0);
  if (conFoto <= 0) return null;

  const meta = total <= 1 ? 1 : total;

  // La firma manda sobre los chulos. Una sola OT con esa marca alcanza.
  if (conFactura >= 1) return "facturada";
  if (conDespacho >= 1) return "despachada";
  if (conReviso >= 1) return "revisada";
  if (total > 1 && conFoto < total) return "alistamiento";
  if (conAlisto >= meta) return "alistada";
  return "alistamiento";
}

function campoLleno(
  campos: Record<string, string> | undefined,
  keys: readonly string[],
): boolean {
  if (!campos) return false;
  const lower = new Map(
    Object.entries(campos).map(([key, value]) => [
      key.toLowerCase(),
      value?.trim() ?? "",
    ]),
  );
  return keys.some((key) => {
    if (campos[key]?.trim()) return true;
    return Boolean(lower.get(key.toLowerCase()));
  });
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

/**
 * Hay revisión si cualquier línea esperada trae el chulo de Revisó,
 * o si la caja Revisó tiene firma. No exige Alistó ni todas las líneas.
 */
export function capturaTieneRevisoCompleto(
  payload: OrdenSurtidoCapturaPayload | null | undefined,
  lineasEsperadas: number,
): boolean {
  if (
    campoLleno(payload?.campos, [
      "revisoNombre",
      "Revisó nombre",
      "Revisó",
      "revisoHora",
      "Revisó hora",
    ])
  ) {
    return true;
  }

  const rows = payload?.lineas ?? [];
  const n = Math.max(0, Math.floor(lineasEsperadas));
  if (n <= 0) return rows.some((linea) => linea.reviso === true);
  for (let indice = 1; indice <= n; indice += 1) {
    const row = rows.find((linea) => linea.indice === indice);
    if (row?.reviso === true) return true;
  }
  return false;
}

/** Caja Factura (OK) o folio de factura asociada. */
export function capturaTieneFactura(
  payload: OrdenSurtidoCapturaPayload | null | undefined,
): boolean {
  return campoLleno(payload?.campos, [
    "facturaOkFolio",
    "facturaOkFirma",
    "facturaOkNombre",
    "facturaOkHora",
    "Factura (OK)",
    "Factura (OK) folio",
    "Factura (OK) firma",
    "Factura (OK) nombre",
    "Factura (OK) hora",
    "facturaAsociada",
    "Folio factura asociada",
    "Factura asociada",
  ]);
}

/** Caja Despachó con nombre o con hora. */
export function capturaTieneDespacho(
  payload: OrdenSurtidoCapturaPayload | null | undefined,
): boolean {
  return campoLleno(payload?.campos, [
    "despachoNombre",
    "Despachó nombre",
    "Despachó",
    "despachoHora",
    "Despachó hora",
  ]);
}

const ESTADOS_QUE_ACEPTAN_ALISTAMIENTO: ReadonlySet<string> = new Set([
  "confirmada",
  "alistamiento",
  "alistada",
  "revisada",
  "despachada",
]);

/** Avanza hasta despachada; Facturado es el cierre y no se pisa. */
export function puedeAplicarEstadoAlistamiento(
  estadoActual: string,
): estadoActual is
  | "confirmada"
  | "alistamiento"
  | "alistada"
  | "revisada"
  | "despachada"
  | EstadoOrdenVenta {
  return ESTADOS_QUE_ACEPTAN_ALISTAMIENTO.has(estadoActual);
}

const RANGO_ESTADO_SURTIDO: Record<string, number> = {
  confirmada: 1,
  alistamiento: 2,
  alistada: 3,
  revisada: 4,
  despachada: 5,
  facturada: 6,
};

/** true si `siguiente` está más adelante que `actual` en el flujo de surtido. */
export function estadoSurtidoEsAvance(actual: string, siguiente: string): boolean {
  return (RANGO_ESTADO_SURTIDO[siguiente] ?? 0) > (RANGO_ESTADO_SURTIDO[actual] ?? 0);
}
