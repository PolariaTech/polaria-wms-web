import { useEffect, type RefObject } from "react";

/**
 * Centra, dentro de su contenedor con scroll lateral, el hijo marcado con
 * `aria-current="true"` cada vez que cambia `activeKey` (o `enabled`).
 * Solo mueve el scroll del contenedor, nunca el de la página. Respeta
 * `prefers-reduced-motion`.
 */
export function useCenterActiveTab(
  containerRef: RefObject<HTMLElement | null>,
  activeKey: unknown,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    const tab = container?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!container || !tab) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    container.scrollTo({
      left: Math.max(
        0,
        tab.offsetLeft - (container.clientWidth - tab.offsetWidth) / 2,
      ),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [containerRef, activeKey, enabled]);
}
