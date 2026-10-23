"use client";

import { useEffect, useRef } from "react";

/**
 * Ejecuta `callback` cada `intervalMs` solo con la pestaña visible,
 * y también al volver a enfocarla.
 */
export function useVisibleInterval(
  callback: () => void,
  intervalMs: number,
  enabled = true,
): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const runIfVisible = () => {
      if (document.visibilityState === "visible") {
        callbackRef.current();
      }
    };

    const intervalId = window.setInterval(runIfVisible, intervalMs);
    document.addEventListener("visibilitychange", runIfVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", runIfVisible);
    };
  }, [enabled, intervalMs]);
}
