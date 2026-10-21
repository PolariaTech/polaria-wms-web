/**
 * Ancho único de Cypher (lista o junto al editor).
 * Misma medida en form dock-left, CSS `html[data-cypher-open]` y el panel derecho.
 */
export const CYPHER_PANEL_WIDTH_CLASS =
  "w-[min(100vw,38.5rem)] max-w-[min(100vw,38.5rem)]";

/** Padding-right / reserva = ancho Cypher (form dock-left). */
export const CYPHER_DOCK_RESERVE_CLASS = "pr-[min(100vw,38.5rem)]";

/** Edge derecho del backdrop dock-left (= inicio de Cypher). */
export const CYPHER_DOCK_RIGHT_CLASS = "right-[min(100vw,38.5rem)]";

export const CYPHER_DOCK_BACKDROP_RIGHT_CLASS = CYPHER_DOCK_RIGHT_CLASS;

export const CYPHER_TRANSITION_MS = 320;
