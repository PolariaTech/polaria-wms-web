import {
  ESPERA_RELEER,
  type RangoEspera,
} from "../ot/aplicar-correccion-correo";

/** Guardar o emitir la OV: rango provisional, falta medirlo con pedidos reales. */
export const ESPERA_GUARDAR_OV: RangoEspera = { minSeg: 5, maxSeg: 30 };
/** Preparar la impresión: rango provisional, falta medirlo con pedidos reales. */
export const ESPERA_IMPRIMIR_OV: RangoEspera = { minSeg: 5, maxSeg: 30 };

export interface EsperaOv {
  titulo: string;
  espera: RangoEspera;
}

/**
 * Qué le dice Polo al usuario mientras el modal de OV está ocupado: qué se está haciendo y
 * cuánto suele tardar. Leer con IA tiene el mismo rango medido que releer el correo.
 */
export function esperaDeOv(estado: {
  isReadingIa: boolean;
  mateoBusyMessage: string | undefined;
}): EsperaOv {
  if (estado.mateoBusyMessage?.trim()) {
    return { titulo: estado.mateoBusyMessage.trim(), espera: ESPERA_IMPRIMIR_OV };
  }
  if (estado.isReadingIa) {
    return { titulo: "Leyendo el pedido…", espera: ESPERA_RELEER };
  }
  return { titulo: "Guardando el pedido…", espera: ESPERA_GUARDAR_OV };
}
