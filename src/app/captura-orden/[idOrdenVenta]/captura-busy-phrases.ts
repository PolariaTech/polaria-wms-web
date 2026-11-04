import type { RangoEspera } from "@/modules/sales/ordenes/utils/ot/aplicar-correccion-correo";

/** Subir y leer la hoja de surtido: rango provisional, falta medirlo con hojas reales. */
export const ESPERA_LEER_HOJA: RangoEspera = { minSeg: 5, maxSeg: 30 };

/** Frases de espera mientras se sube/lee la hoja de surtido (REQ-055). */
export const CAPTURA_BUSY_PHRASES = [
  "Iniciando escaneo…",
  "Preparando la foto…",
  "Subiendo imagen…",
  "Leyendo la hoja…",
  "Extrayendo datos…",
  "Revisando casillas y firmas…",
  "Casi listo…",
] as const;

/** Última frase antes del check «Listo». */
export const CAPTURA_DONE_PHRASE = "Listo";

export const CAPTURA_BUSY_PHRASE_MS = 2800;
export const CAPTURA_DONE_PHRASE_MS = 900;
