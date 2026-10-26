/**
 * Ancho de Cypher (lista o junto al editor).
 * REQ-121: tramos para tablet / laptop / monitor amplio.
 * REQ-150: el usuario puede achicar/agrandar (±1 tramo) con preferencia en localStorage.
 *
 * Clases literales completas (Tailwind no genera utilities armadas con template strings).
 *
 * | Viewport        | compact | normal | wide   |
 * |-----------------|---------|--------|--------|
 * | < 1280px        | 16rem   | 20rem  | 24rem  |
 * | 1280px – 1599px | 22rem   | 26rem  | 32rem  |
 * | ≥ 1600px        | 30rem   | 38.5rem| 44rem  |
 */

export const CYPHER_MID_MIN_WIDTH_PX = 1280;
export const CYPHER_WIDE_MIN_WIDTH_PX = 1600;

export type CypherWidthMode = "compact" | "normal" | "wide";

export const CYPHER_WIDTH_STORAGE_KEY = "polaria.cypher.widthMode";

type WidthBundle = {
  panel: string;
  reserve: string;
  dockRight: string;
};

/** Literales completas por modo — no interpolar rem en runtime. */
const WIDTH_CLASSES: Record<CypherWidthMode, WidthBundle> = {
  compact: {
    panel:
      "w-[min(100vw,16rem)] max-w-[min(100vw,16rem)] min-[1280px]:w-[min(100vw,22rem)] min-[1280px]:max-w-[min(100vw,22rem)] min-[1600px]:w-[min(100vw,30rem)] min-[1600px]:max-w-[min(100vw,30rem)]",
    reserve:
      "pr-[min(100vw,16rem)] min-[1280px]:pr-[min(100vw,22rem)] min-[1600px]:pr-[min(100vw,30rem)]",
    dockRight:
      "right-[min(100vw,16rem)] min-[1280px]:right-[min(100vw,22rem)] min-[1600px]:right-[min(100vw,30rem)]",
  },
  normal: {
    panel:
      "w-[min(100vw,20rem)] max-w-[min(100vw,20rem)] min-[1280px]:w-[min(100vw,26rem)] min-[1280px]:max-w-[min(100vw,26rem)] min-[1600px]:w-[min(100vw,38.5rem)] min-[1600px]:max-w-[min(100vw,38.5rem)]",
    reserve:
      "pr-[min(100vw,20rem)] min-[1280px]:pr-[min(100vw,26rem)] min-[1600px]:pr-[min(100vw,38.5rem)]",
    dockRight:
      "right-[min(100vw,20rem)] min-[1280px]:right-[min(100vw,26rem)] min-[1600px]:right-[min(100vw,38.5rem)]",
  },
  wide: {
    panel:
      "w-[min(100vw,24rem)] max-w-[min(100vw,24rem)] min-[1280px]:w-[min(100vw,32rem)] min-[1280px]:max-w-[min(100vw,32rem)] min-[1600px]:w-[min(100vw,44rem)] min-[1600px]:max-w-[min(100vw,44rem)]",
    reserve:
      "pr-[min(100vw,24rem)] min-[1280px]:pr-[min(100vw,32rem)] min-[1600px]:pr-[min(100vw,44rem)]",
    dockRight:
      "right-[min(100vw,24rem)] min-[1280px]:right-[min(100vw,32rem)] min-[1600px]:right-[min(100vw,44rem)]",
  },
};

export function readCypherWidthMode(): CypherWidthMode {
  if (typeof window === "undefined") return "normal";
  try {
    const raw = window.localStorage.getItem(CYPHER_WIDTH_STORAGE_KEY);
    if (raw === "compact" || raw === "normal" || raw === "wide") return raw;
  } catch {
    /* ignore */
  }
  return "normal";
}

export function writeCypherWidthMode(mode: CypherWidthMode): void {
  try {
    window.localStorage.setItem(CYPHER_WIDTH_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function cycleCypherWidthMode(
  current: CypherWidthMode,
  direction: -1 | 1,
): CypherWidthMode {
  const order: CypherWidthMode[] = ["compact", "normal", "wide"];
  const idx = order.indexOf(current);
  const next = Math.min(order.length - 1, Math.max(0, idx + direction));
  return order[next]!;
}

/** Default (normal) — usado por form/confirm dock cuando no hay contexto de modo. */
export const CYPHER_PANEL_WIDTH_CLASS = WIDTH_CLASSES.normal.panel;
export const CYPHER_DOCK_RESERVE_CLASS = WIDTH_CLASSES.normal.reserve;
export const CYPHER_DOCK_RIGHT_CLASS = WIDTH_CLASSES.normal.dockRight;
export const CYPHER_DOCK_BACKDROP_RIGHT_CLASS = CYPHER_DOCK_RIGHT_CLASS;

export function cypherPanelWidthClass(mode: CypherWidthMode): string {
  return WIDTH_CLASSES[mode].panel;
}

export function cypherDockReserveClass(mode: CypherWidthMode): string {
  return WIDTH_CLASSES[mode].reserve;
}

export function cypherDockRightClass(mode: CypherWidthMode): string {
  return WIDTH_CLASSES[mode].dockRight;
}

export const CYPHER_TRANSITION_MS = 320;
