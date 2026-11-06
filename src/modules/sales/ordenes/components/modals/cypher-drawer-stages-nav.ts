"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { CYPHER_PIPELINE_NESTED_IDS, type CypherStageId } from "./cypher-stages";

interface UseCypherDrawerStagesNavArgs {
  setOpenStages: Dispatch<SetStateAction<ReadonlySet<CypherStageId>>>;
  setActiveStage: Dispatch<SetStateAction<CypherStageId>>;
}

export function useCypherDrawerStagesNav({
  setOpenStages,
  setActiveStage,
}: UseCypherDrawerStagesNavArgs) {
  const scrollToStage = useCallback(
    (stageId: CypherStageId) => {
      setActiveStage(stageId);
      setOpenStages((prev) => {
        const next = new Set(prev);
        next.add(stageId);
        if (CYPHER_PIPELINE_NESTED_IDS.has(stageId)) {
          next.add("cambio-estado");
        }
        return next;
      });
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.getElementById(`cypher-stage-${stageId}`)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      });
    },
    [setActiveStage, setOpenStages],
  );

  const toggleAccordionStage = useCallback(
    (stageId: CypherStageId) => {
      setOpenStages((prev) => {
        const next = new Set(prev);
        if (next.has(stageId)) {
          next.delete(stageId);
        } else {
          next.add(stageId);
          if (CYPHER_PIPELINE_NESTED_IDS.has(stageId)) {
            next.add("cambio-estado");
          }
        }
        return next;
      });
      setActiveStage(stageId);
    },
    [setActiveStage, setOpenStages],
  );

  return { scrollToStage, toggleAccordionStage };
}
