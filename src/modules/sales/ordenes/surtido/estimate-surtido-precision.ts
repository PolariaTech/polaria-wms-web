import { campoSurtido } from "./apply-surtido-to-print";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

const CABECERA_PESOS: Array<{ keys: string[]; peso: number }> = [
  { keys: ["chofer", "Chofer"], peso: 12 },
  { keys: ["unidad", "Unidad"], peso: 10 },
  { keys: ["horaSugeridaSalida", "Hora sugerida de salida"], peso: 10 },
  { keys: ["horaComprometida", "Hora comprometida"], peso: 6 },
  {
    keys: ["facturaAsociada", "Folio factura asociada", "Factura asociada"],
    peso: 8,
  },
  { keys: ["alistoNombre", "Alistó nombre"], peso: 5 },
  { keys: ["despachoNombre", "Despachó nombre"], peso: 5 },
  { keys: ["facturaOkFolio", "Factura (OK) folio"], peso: 5 },
  { keys: ["facturaOkFirma", "Factura (OK) firma"], peso: 5 },
  { keys: ["recepcionNombre", "Recepción nombre"], peso: 5 },
];

const CHECK_PESOS: Array<{
  key: keyof OrdenSurtidoCapturaPayload["checks"];
  peso: number;
}> = [
  { key: "turnoPm", peso: 6 },
  { key: "turnoNocheAm", peso: 6 },
  { key: "mercanciaCoincide", peso: 4 },
  { key: "recepcionAceptadoCompleto", peso: 4 },
  { key: "recepcionAceptadoParcial", peso: 3 },
];

/**
 * Estima % de precisión / cobertura de lectura de la hoja.
 * Combina campos de cabecera, checks respondidos y líneas con cantidad preparada.
 */
export function estimateSurtidoPrecision(
  payload: OrdenSurtidoCapturaPayload,
  lineasEsperadas: number,
): number {
  let score = 0;
  let max = 0;

  for (const item of CABECERA_PESOS) {
    max += item.peso;
    if (campoSurtido(payload, ...item.keys)) score += item.peso;
  }

  for (const item of CHECK_PESOS) {
    max += item.peso;
    const value = payload.checks?.[item.key];
    if (value === true || value === false) score += item.peso;
  }

  const expected = Math.max(1, lineasEsperadas);
  // REQ-153: el peso fuerte es Alistó (lo que mueve el estado); Revisó solo no cuenta como línea completa.
  const perLineAlisto = 10;
  const perLinePrep = 4;
  const perLineOtro = 2;
  max += expected * (perLineAlisto + perLinePrep);

  const byIndex = new Map(
    (payload.lineas ?? []).map((linea) => [linea.indice, linea] as const),
  );
  for (let i = 1; i <= expected; i += 1) {
    const linea = byIndex.get(i);
    if (!linea) continue;
    if (linea.alisto === true) score += perLineAlisto;
    if (Boolean(linea.cantidadPreparada?.trim())) score += perLinePrep;
    else if (
      Boolean(linea.especificacion?.trim()) ||
      Boolean(linea.codigoIncidencia?.trim()) ||
      Boolean(linea.nota?.trim())
    ) {
      score += perLineOtro;
    }
  }

  // Bonus si hay al menos una línea leída aunque el índice no calce
  if ((payload.lineas?.length ?? 0) > 0 && score < max * 0.2) {
    score += Math.round(max * 0.1);
  }

  if (max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((100 * score) / max)));
}

export function labelPrecision(precision: number): string {
  if (precision >= 85) return "Alta";
  if (precision >= 60) return "Media";
  if (precision >= 35) return "Baja";
  return "Muy baja";
}
