"use client";

import type {
  EstadoBodegaSectionView,
  EstadoBodegaSlot,
} from "../types/estado-bodega.types";
import { EstadoBodegaSlotCell } from "./EstadoBodegaSlotCell";

const GAP_PX = 8;
const GAP_PX_SM = 12;

export const ESTADO_BODEGA_SLOT_GAP_PX = GAP_PX_SM;
export const ESTADO_BODEGA_PANEL_WIDTH_CHROME_PX = 20;
export const ESTADO_BODEGA_MAP_COLUMN_GAP_PX = 12;
export const ESTADO_BODEGA_SIDE_PANEL_CHROME_PX = 96;
export const ESTADO_BODEGA_MIN_SLOT_SIZE_PX = 72;

export function getEstadoBodegaSlotGap(containerWidth: number) {
  return containerWidth >= 640 ? GAP_PX_SM : GAP_PX;
}

export function computeEstadoBodegaSlotSize(
  width: number,
  height: number,
  cols: number,
  rows: number,
  gap: number,
): number {
  if (width <= 0 && height <= 0) return 0;

  const byWidth = width > 0 ? (width - (cols - 1) * gap) / cols : Number.POSITIVE_INFINITY;
  const byHeight =
    height > 0 ? (height - (rows - 1) * gap) / rows : Number.POSITIVE_INFINITY;

  return Math.floor(Math.min(byWidth, byHeight));
}

/** Tamaño de slot en desktop: ancho del contenedor + altura lateral (si ya es fiable). */
export function computeEstadoBodegaDesktopSlotSize(
  containerWidth: number,
  sideColumnHeight: number,
): number {
  const gap = ESTADO_BODEGA_SLOT_GAP_PX;
  const panelChrome = ESTADO_BODEGA_PANEL_WIDTH_CHROME_PX;
  const mapGaps = ESTADO_BODEGA_MAP_COLUMN_GAP_PX;

  if (containerWidth <= 0) return 0;

  const byMapWidth = Math.floor(
    (containerWidth - 2 * mapGaps - 3 * panelChrome - 5 * gap) / 8,
  );

  const sideTrackWidth = Math.max(0, (containerWidth - 2 * mapGaps) / 4);
  const bySideWidth = computeEstadoBodegaSlotSize(
    sideTrackWidth - panelChrome,
    0,
    2,
    4,
    gap,
  );
  const byCenterWidth = computeEstadoBodegaSlotSize(
    sideTrackWidth * 2 - panelChrome,
    0,
    4,
    3,
    gap,
  );

  const minGridHeight = ESTADO_BODEGA_MIN_SLOT_SIZE_PX * 4 + 3 * gap;
  let bySideHeight = Number.POSITIVE_INFINITY;
  if (
    sideColumnHeight >=
    ESTADO_BODEGA_SIDE_PANEL_CHROME_PX + minGridHeight
  ) {
    bySideHeight = computeEstadoBodegaSlotSize(
      0,
      sideColumnHeight - ESTADO_BODEGA_SIDE_PANEL_CHROME_PX,
      2,
      4,
      gap,
    );
  }

  const candidates = [byMapWidth, bySideWidth, byCenterWidth, bySideHeight].filter(
    (value) => Number.isFinite(value) && value > 0,
  );

  if (candidates.length === 0) {
    return ESTADO_BODEGA_MIN_SLOT_SIZE_PX;
  }

  return Math.max(
    ESTADO_BODEGA_MIN_SLOT_SIZE_PX,
    Math.min(...candidates),
  );
}

/** Margen extra de slot en custodio (4 columnas) cuando el ancho lo permite. */
export const ESTADO_BODEGA_CUSTODIO_SLOT_BOOST_PX = 6;

/**
 * Desktop custodio: 4 paneles 2×4. Usa el ancho disponible y, si cabe,
 * un poco más que el tamaño operativo de entrada/salida.
 */
export function computeEstadoBodegaCustodioDesktopSlotSize(
  containerWidth: number,
): number {
  const mapGaps = ESTADO_BODEGA_MAP_COLUMN_GAP_PX;
  const panelChrome = ESTADO_BODEGA_PANEL_WIDTH_CHROME_PX;
  const gap = ESTADO_BODEGA_SLOT_GAP_PX;
  const columns = 4;

  if (containerWidth <= 0) return 0;

  const chromeTotal =
    columns * panelChrome + columns * gap + (columns - 1) * mapGaps;
  const byFourColumns = Math.floor((containerWidth - chromeTotal) / 8);

  const operativoTarget = computeEstadoBodegaDesktopSlotSize(
    containerWidth,
    0,
  );
  const boostedTarget = operativoTarget + ESTADO_BODEGA_CUSTODIO_SLOT_BOOST_PX;

  const candidates = [byFourColumns, boostedTarget].filter(
    (value) => Number.isFinite(value) && value > 0,
  );

  if (candidates.length === 0) {
    return ESTADO_BODEGA_MIN_SLOT_SIZE_PX;
  }

  return Math.max(
    ESTADO_BODEGA_MIN_SLOT_SIZE_PX,
    Math.min(...candidates),
  );
}

interface EstadoBodegaSlotGridProps {
  section: EstadoBodegaSectionView;
  accentClassName: string;
  slotSize: number;
  onSelectSlot?: (slot: EstadoBodegaSlot) => void;
}

export function EstadoBodegaSlotGrid({
  section,
  accentClassName,
  slotSize,
  onSelectSlot,
}: EstadoBodegaSlotGridProps) {
  if (slotSize <= 0) {
    return null;
  }

  const gap = GAP_PX_SM;
  const gridWidth = section.cols * slotSize + (section.cols - 1) * gap;
  const gridHeight = section.rows * slotSize + (section.rows - 1) * gap;

  return (
    <div
      className="grid shrink-0"
      style={{
        gap,
        width: gridWidth,
        height: gridHeight,
        gridTemplateColumns: `repeat(${section.cols}, ${slotSize}px)`,
        gridTemplateRows: `repeat(${section.rows}, ${slotSize}px)`,
      }}
    >
      {section.slots.map((slot) => (
        <EstadoBodegaSlotCell
          key={`${section.id}-${slot.slotNumber}`}
          slot={slot}
          accentClassName={accentClassName}
          size={slotSize}
          onSelect={onSelectSlot}
        />
      ))}
    </div>
  );
}
