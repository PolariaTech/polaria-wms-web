"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import {
  ESTADO_BODEGA_PANEL_WIDTH_CHROME_PX,
  ESTADO_BODEGA_SLOT_GAP_PX,
} from "@/modules/warehouses/estado-bodega/components/EstadoBodegaSlotGrid";

export const CUSTODIO_PANEL_CHROME_PX = ESTADO_BODEGA_PANEL_WIDTH_CHROME_PX;

export function custodioPanelWidth(slotSize: number, cols = 2, rows = 4) {
  const gap = ESTADO_BODEGA_SLOT_GAP_PX;
  return cols * slotSize + (cols - 1) * gap + CUSTODIO_PANEL_CHROME_PX;
}

interface CustodioSidePanelProps {
  children: ReactNode;
  slotSize: number;
  panelClassName: string;
  className?: string;
}

export function CustodioSidePanel({
  children,
  slotSize,
  panelClassName,
  className,
}: CustodioSidePanelProps) {
  const width = custodioPanelWidth(slotSize);

  return (
    <section
      style={{ width, maxWidth: "100%" }}
      className={cn(
        "flex h-full min-h-0 max-w-full flex-col overflow-y-auto rounded-2xl border px-2 py-3 sm:px-2.5 sm:py-4",
        panelClassName,
        className,
      )}
    >
      {children}
    </section>
  );
}
