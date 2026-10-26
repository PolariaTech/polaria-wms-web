/**
 * Ancho de Cypher (lista o junto al editor).
 * REQ-121: tramos para tablet / laptop / monitor amplio.
 * Misma medida en form dock-left, confirm dock-left y el panel derecho.
 *
 * | Viewport        | Cypher | Ejemplos              |
 * |-----------------|--------|-----------------------|
 * | < 1280px        | 20rem  | iPad, 1232, 1024      |
 * | 1280px – 1599px | 26rem  | 1366 laptop           |
 * | ≥ 1600px        | 38.5rem| monitores amplios     |
 */

/** Umbral CSS: a partir de aquí Cypher pasa a tramo medio. */
export const CYPHER_MID_MIN_WIDTH_PX = 1280;

/** Umbral CSS: a partir de aquí Cypher ancho completo. */
export const CYPHER_WIDE_MIN_WIDTH_PX = 1600;

/**
 * Ancho del panel Cypher (ver tabla arriba).
 */
export const CYPHER_PANEL_WIDTH_CLASS =
  "w-[min(100vw,20rem)] max-w-[min(100vw,20rem)] min-[1280px]:w-[min(100vw,26rem)] min-[1280px]:max-w-[min(100vw,26rem)] min-[1600px]:w-[min(100vw,38.5rem)] min-[1600px]:max-w-[min(100vw,38.5rem)]";

/** Padding-right / reserva = ancho Cypher (form dock-left). */
export const CYPHER_DOCK_RESERVE_CLASS =
  "pr-[min(100vw,20rem)] min-[1280px]:pr-[min(100vw,26rem)] min-[1600px]:pr-[min(100vw,38.5rem)]";

/** Edge derecho del backdrop dock-left (= inicio de Cypher). */
export const CYPHER_DOCK_RIGHT_CLASS =
  "right-[min(100vw,20rem)] min-[1280px]:right-[min(100vw,26rem)] min-[1600px]:right-[min(100vw,38.5rem)]";

export const CYPHER_DOCK_BACKDROP_RIGHT_CLASS = CYPHER_DOCK_RIGHT_CLASS;

export const CYPHER_TRANSITION_MS = 320;
