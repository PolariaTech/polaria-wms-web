"use client";

import { Package } from "lucide-react";
import { type FormEvent, useCallback } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import {
  JefeBodegaModalHint,
  JefeBodegaModalNotice,
  JefeBodegaModalSearchField,
  JefeBodegaModalSection,
} from "./jefe-bodega-modal-ui";

interface JefeBodegaRevisarModalProps {
  open: boolean;
  onClose: () => void;
}

export function JefeBodegaRevisarModal({
  open,
  onClose,
}: JefeBodegaRevisarModalProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Consultar inventario"
      description="Elegí una caja en ingreso, bodega o salida para que el operario la revise en detalle."
      onSubmit={handleSubmit}
      submitLabel="Crear revisión"
      submitDisabled
      size="md"
    >
      <JefeBodegaModalSection icon={Package} label="Caja a revisar">
        <JefeBodegaModalSearchField
          id="jefe-revisar-caja"
          placeholder="Sin cajas en el sistema"
        />
        <JefeBodegaModalNotice>
          No hay mercancía en ninguna zona todavía. Cuando existan cajas, vas a
          poder pedir una revisión acá.
        </JefeBodegaModalNotice>
        <JefeBodegaModalHint>
          Las opciones se agrupan por zona para ubicarla más rápido.
        </JefeBodegaModalHint>
      </JefeBodegaModalSection>
    </PolariaFormModal>
  );
}
