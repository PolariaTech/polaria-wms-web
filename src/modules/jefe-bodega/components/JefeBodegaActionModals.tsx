"use client";

import type { JefeBodegaActionId } from "../constants/jefe-bodega-actions";
import { JefeBodegaIngresoModal } from "./modals/JefeBodegaIngresoModal";
import { JefeBodegaRevisarModal } from "./modals/JefeBodegaRevisarModal";
import { JefeBodegaSalidaModal } from "./modals/JefeBodegaSalidaModal";
import { JefeBodegaTransferenciaModal } from "./modals/JefeBodegaTransferenciaModal";

interface JefeBodegaActionModalsProps {
  activeModal: JefeBodegaActionId | null;
  onClose: () => void;
}

export function JefeBodegaActionModals({
  activeModal,
  onClose,
}: JefeBodegaActionModalsProps) {
  return (
    <>
      <JefeBodegaIngresoModal
        open={activeModal === "ingresos"}
        onClose={onClose}
      />
      <JefeBodegaTransferenciaModal
        open={activeModal === "bodega-a-bodega"}
        onClose={onClose}
      />
      <JefeBodegaRevisarModal
        open={activeModal === "revisar"}
        onClose={onClose}
      />
      <JefeBodegaSalidaModal
        open={activeModal === "crear-salida"}
        onClose={onClose}
      />
    </>
  );
}
