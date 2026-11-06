"use client";

import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";
import { CYPHER_STAGES, type CypherStageId } from "./cypher-stages";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";

interface UseCypherDrawerScrollSpyArgs {
  open: boolean;
  isLoading: boolean;
  error: string | null;
  orden: OrdenVentaDetalleRow | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  setActiveStage: Dispatch<SetStateAction<CypherStageId>>;
}

export function useCypherDrawerScrollSpy({
  open,
  isLoading,
  error,
  orden,
  scrollRef,
  setActiveStage,
}: UseCypherDrawerScrollSpyArgs) {
  useEffect(() => {
    if (!open || isLoading || error || !orden) return;
    const root = scrollRef.current;
    if (!root) return;

    const updateActiveStage = () => {
      const lastStage = CYPHER_STAGES[CYPHER_STAGES.length - 1]!.id;
      const canScroll = root.scrollHeight > root.clientHeight + 4;
      const atBottom =
        canScroll && root.scrollTop + root.clientHeight >= root.scrollHeight - 12;
      if (atBottom) {
        setActiveStage((prev) => (prev === lastStage ? prev : lastStage));
        return;
      }

      const marker = root.getBoundingClientRect().top + 28;
      let current: CypherStageId = CYPHER_STAGES[0]!.id;
      for (const stage of CYPHER_STAGES) {
        const el = document.getElementById(`cypher-stage-${stage.id}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= marker) {
          current = stage.id;
        }
      }
      setActiveStage((prev) => (prev === current ? prev : current));
    };

    updateActiveStage();
    root.addEventListener("scroll", updateActiveStage, { passive: true });
    window.addEventListener("resize", updateActiveStage);
    return () => {
      root.removeEventListener("scroll", updateActiveStage);
      window.removeEventListener("resize", updateActiveStage);
    };
  }, [error, isLoading, open, orden, scrollRef, setActiveStage]);
}
