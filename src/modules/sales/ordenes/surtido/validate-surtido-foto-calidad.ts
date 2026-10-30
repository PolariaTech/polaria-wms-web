import { campoSurtido } from "./apply-surtido-to-print";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

/** Foto no es la hoja de surtido / OV impresa. */
export const MSG_CAPTURA_NO_HOJA =
  "No se ve la hoja de surtido. Toma la foto de la hoja impresa, de frente y completa.";

/** Hoja presente pero inutilizable (casi nada se lee / no hay señal de captura). */
export const MSG_CAPTURA_FOTO_MALA =
  "La foto no se pudo leer bien. Acerca la cámara a la hoja impresa (puede ser imperfecta) y vuelve a intentar.";

/**
 * Precisión mínima (0–100) para aceptar una hoja imperfecta.
 * ~40%: basta con que se vea el papel y se haya leído algo útil.
 */
export const UMBRAL_PRECISION_ACEPTABLE = 40;

export type CalificacionFotoSurtido =
  | { ok: true }
  | { ok: false; error: string; codigo: "no_hoja" | "foto_mala" | "precision_baja" };

function payloadTieneSenalLectura(payload: OrdenSurtidoCapturaPayload): boolean {
  if (campoSurtido(payload, "chofer", "Chofer")) return true;
  if (campoSurtido(payload, "unidad", "Unidad")) return true;
  if (campoSurtido(payload, "alistoNombre", "Alistó nombre")) return true;
  if (campoSurtido(payload, "horaSugeridaSalida", "Hora sugerida de salida")) {
    return true;
  }
  const lineas = payload.lineas ?? [];
  return lineas.some(
    (linea) =>
      linea.alisto === true ||
      linea.reviso === true ||
      Boolean(linea.cantidadPreparada?.trim()),
  );
}

function precisionPayload(payload: OrdenSurtidoCapturaPayload): number {
  return typeof payload.precisionEstimada === "number"
    ? payload.precisionEstimada
    : 0;
}

/**
 * Decide si la foto del QR es aceptable para guardar captura.
 * Exige que se vea la hoja; el encuadre/legibilidad pueden ser imperfectos
 * si hay ~40% de precisión o señal de lectura (REQ-194 aflojado).
 */
export function evaluarCalidadFotoSurtido(
  payload: OrdenSurtidoCapturaPayload,
): CalificacionFotoSurtido {
  const calidad = payload.calidadFoto;
  const precision = precisionPayload(payload);
  const tieneSenal = payloadTieneSenalLectura(payload);

  if (calidad) {
    if (!calidad.esHojaSurtido) {
      return { ok: false, error: MSG_CAPTURA_NO_HOJA, codigo: "no_hoja" };
    }
    // Es la hoja: aceptar si Mateo la da por usable O si hay señal / ~40%.
    if (
      calidad.hojaCompletaYLegible ||
      precision >= UMBRAL_PRECISION_ACEPTABLE ||
      tieneSenal
    ) {
      return { ok: true };
    }
    return { ok: false, error: MSG_CAPTURA_FOTO_MALA, codigo: "foto_mala" };
  }

  if (precision < UMBRAL_PRECISION_ACEPTABLE && !tieneSenal) {
    return {
      ok: false,
      error: MSG_CAPTURA_FOTO_MALA,
      codigo: "precision_baja",
    };
  }

  return { ok: true };
}
