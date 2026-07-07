"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  computeEstadoBodegaCustodioDesktopSlotSize,
  computeEstadoBodegaDesktopSlotSize,
  computeEstadoBodegaSlotSize,
  ESTADO_BODEGA_SIDE_PANEL_CHROME_PX,
  ESTADO_BODEGA_SLOT_GAP_PX,
  getEstadoBodegaSlotGap,
} from "../components/EstadoBodegaSlotGrid";

/** Altura fija de la grilla 2×4 para alinear columnas del custodio. */
export function estadoBodegaZoneGridHeight(slotSize: number): number {
  if (slotSize <= 0) return 0;
  return 4 * slotSize + 3 * ESTADO_BODEGA_SLOT_GAP_PX;
}

/** Altura de columna custodio: grilla + cabecera/pie del panel. */
export function estadoBodegaCustodioColumnHeight(slotSize: number): number {
  if (slotSize <= 0) return 0;
  return (
    estadoBodegaZoneGridHeight(slotSize) + ESTADO_BODEGA_SIDE_PANEL_CHROME_PX
  );
}

/** Ancho del panel lateral compacto (misma fórmula que EstadoBodegaSectionPanel). */
export function estadoBodegaSidePanelWidth(slotSize: number): number {
  if (slotSize <= 0) return 0;
  return 2 * slotSize + ESTADO_BODEGA_SLOT_GAP_PX + 20;
}

/**
 * Calcula slot size estable solo con el ancho del contenedor.
 * No observa altura de columnas para evitar ciclos de resize.
 */
export function useEstadoBodegaSlotSize(
  containerRef: RefObject<HTMLDivElement | null>,
  mode: "operativo" | "custodio" = "operativo",
): number {
  const [slotSize, setSlotSize] = useState(0);
  const lockedSizeRef = useRef(0);

  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const measure = () => {
      const containerWidth = containerEl.clientWidth;
      if (containerWidth <= 0) return;

      const gap = getEstadoBodegaSlotGap(containerWidth);
      let nextSize: number;

      if (!window.matchMedia("(min-width: 1024px)").matches) {
        nextSize =
          mode === "custodio"
            ? computeEstadoBodegaSlotSize(containerWidth - 32, 0, 2, 4, gap)
            : computeEstadoBodegaSlotSize(containerWidth - 32, 0, 4, 3, gap);
      } else {
        nextSize =
          mode === "custodio"
            ? computeEstadoBodegaCustodioDesktopSlotSize(containerWidth)
            : computeEstadoBodegaDesktopSlotSize(containerWidth, 0);
      }

      if (nextSize <= 0 || nextSize === lockedSizeRef.current) return;

      lockedSizeRef.current = nextSize;
      setSlotSize(nextSize);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(containerEl);

    return () => ro.disconnect();
  }, [containerRef, mode]);

  return slotSize;
}
