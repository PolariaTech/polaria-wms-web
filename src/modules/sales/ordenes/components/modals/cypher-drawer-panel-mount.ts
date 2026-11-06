"use client";

import { useEffect, useState } from "react";
import { CYPHER_TRANSITION_MS } from "../../constants/cypher-layout";

export function useCypherDrawerPanelMount(open: boolean) {
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);

  useEffect(() => {
    if (open) {
      setPanelEntered(false);
      setPanelMounted(true);
      let inner = 0;
      const outer = window.requestAnimationFrame(() => {
        inner = window.requestAnimationFrame(() => setPanelEntered(true));
      });
      return () => {
        window.cancelAnimationFrame(outer);
        window.cancelAnimationFrame(inner);
      };
    }

    setPanelEntered(false);
    const timeout = window.setTimeout(() => {
      setPanelMounted(false);
    }, CYPHER_TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  return { panelMounted, panelEntered };
}
