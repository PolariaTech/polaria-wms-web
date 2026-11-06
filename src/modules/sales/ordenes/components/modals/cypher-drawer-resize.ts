"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  hydrateCypherWidthModeFromStorage,
  useShellOverlayStore,
} from "@/stores/shell-overlay.store";

export function useCypherDrawerResize() {
  const cypherWidthMode = useShellOverlayStore((s) => s.cypherWidthMode);
  const setCypherWidthMode = useShellOverlayStore((s) => s.setCypherWidthMode);
  const resizeDragRef = useRef<{
    startX: number;
    originMode: typeof cypherWidthMode;
    lastStep: number;
  } | null>(null);
  const [isResizingWidth, setIsResizingWidth] = useState(false);

  useEffect(() => {
    hydrateCypherWidthModeFromStorage();
  }, []);

  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      resizeDragRef.current = {
        startX: event.clientX,
        originMode: cypherWidthMode,
        lastStep: 0,
      };
      setIsResizingWidth(true);
    },
    [cypherWidthMode],
  );

  const handleResizePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = resizeDragRef.current;
      if (!drag) return;
      const deltaPx = drag.startX - event.clientX;
      const step = Math.max(-2, Math.min(2, Math.round(deltaPx / 56)));
      if (step === drag.lastStep) return;
      drag.lastStep = step;
      const order = ["compact", "normal", "wide"] as const;
      const originIdx = order.indexOf(drag.originMode);
      const nextIdx = Math.max(0, Math.min(order.length - 1, originIdx + step));
      setCypherWidthMode(order[nextIdx]!);
    },
    [setCypherWidthMode],
  );

  const handleResizePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!resizeDragRef.current) return;
      resizeDragRef.current = null;
      setIsResizingWidth(false);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  return {
    cypherWidthMode,
    isResizingWidth,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizePointerUp,
  };
}
