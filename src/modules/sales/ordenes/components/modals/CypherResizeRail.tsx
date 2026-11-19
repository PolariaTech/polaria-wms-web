"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils/cn";

/** Rail de arrastre del ancho Cypher (REQ-307 / REQ-330). */
export function CypherResizeRail({
  isResizingWidth,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  isResizingWidth: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionar panel Cypher"
      title="Arrastra para achicar o agrandar"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        // REQ-307: rail hacia dentro del panel (sin -translate) para que
        // el drag no caiga sobre el editor dock-left.
        "absolute inset-y-0 left-0 z-30 w-3 cursor-col-resize touch-none",
        "hover:bg-polaria-teal/40",
        isResizingWidth && "bg-polaria-teal/50",
      )}
    />
  );
}
