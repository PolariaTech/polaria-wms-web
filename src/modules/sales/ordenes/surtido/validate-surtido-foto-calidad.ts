import { campoSurtido } from "./apply-surtido-to-print";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

/** Foto no es la hoja de surtido / OV impresa. */
export const MSG_CAPTURA_NO_HOJA =
  "No se ve la hoja de surtido. Toma la foto de la hoja impresa, de frente y completa.";

/** Hoja presente pero mal tomada (ángulo, manos, borrosa, hora ilegible). */
export const MSG_CAPTURA_FOTO_MALA =
  "La foto fue tomada mal. Intenta de nuevo: encaja la hoja completa dentro del marco y asegúrate de que se vea clara (incluida la hora impresa).";

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

/**
 * Decide si la foto del QR es aceptable para guardar captura.
 * Prioriza el veredicto de visión (`calidadFoto`); si falta, usa precisión baja.
 */
export function evaluarCalidadFotoSurtido(
  payload: OrdenSurtidoCapturaPayload,
): CalificacionFotoSurtido {
  const calidad = payload.calidadFoto;
  if (calidad) {
    if (!calidad.esHojaSurtido) {
      return { ok: false, error: MSG_CAPTURA_NO_HOJA, codigo: "no_hoja" };
    }
    if (!calidad.hojaCompletaYLegible) {
      return { ok: false, error: MSG_CAPTURA_FOTO_MALA, codigo: "foto_mala" };
    }
    return { ok: true };
  }

  const precision =
    typeof payload.precisionEstimada === "number"
      ? payload.precisionEstimada
      : 0;
  if (precision < 15 && !payloadTieneSenalLectura(payload)) {
    return {
      ok: false,
      error: MSG_CAPTURA_FOTO_MALA,
      codigo: "precision_baja",
    };
  }

  return { ok: true };
}
