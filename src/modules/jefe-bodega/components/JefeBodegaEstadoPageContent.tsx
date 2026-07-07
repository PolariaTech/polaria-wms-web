"use client";

import { useState } from "react";
import { EstadoBodegaPageContent } from "@/modules/warehouses";
import type { JefeBodegaActionId } from "../constants/jefe-bodega-actions";
import { JefeBodegaActionBar } from "./JefeBodegaActionBar";
import { JefeBodegaActionModals } from "./JefeBodegaActionModals";

export function JefeBodegaEstadoPageContent() {
  const [activeModal, setActiveModal] = useState<JefeBodegaActionId | null>(
    null,
  );

  return (
    <>
      <EstadoBodegaPageContent
        operacionTabs={
          <JefeBodegaActionBar onActionClick={setActiveModal} />
        }
      />
      <JefeBodegaActionModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
}
