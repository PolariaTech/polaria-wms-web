import type { RangoEspera } from "@/modules/sales/ordenes/utils/ot/aplicar-correccion-correo";

/** Subir y leer la hoja de surtido: rango provisional, falta medirlo con hojas reales. */
export const ESPERA_LEER_HOJA: RangoEspera = { minSeg: 5, maxSeg: 30 };

/** Frases mientras el servidor lee la hoja, ya con la foto recibida (REQ-055, REQ-247). */
export const CAPTURA_BUSY_PHRASES = [
  "Leyendo la hoja…",
  "Extrayendo datos…",
  "Revisando casillas y firmas…",
  "Casi listo…",
] as const;

/** Título del estado «foto guardada». */
export const CAPTURA_DONE_PHRASE = "Listo";

export const CAPTURA_BUSY_PHRASE_MS = 2800;
