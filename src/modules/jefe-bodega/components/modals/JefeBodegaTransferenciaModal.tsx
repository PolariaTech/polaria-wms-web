"use client";

import { Box, LayoutGrid, MapPin, Package } from "lucide-react";
import { type FormEvent, useCallback } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import {
  JefeBodegaModalHint,
  JefeBodegaModalSearchField,
  JefeBodegaModalSection,
} from "./jefe-bodega-modal-ui";

interface JefeBodegaTransferenciaModalProps {
  open: boolean;
  onClose: () => void;
}

export function JefeBodegaTransferenciaModal({
  open,
  onClose,
}: JefeBodegaTransferenciaModalProps) {
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
      title="Transferir cajas"
      description="Mové mercancía de un casillero a otro dentro del almacenamiento."
      onSubmit={handleSubmit}
      submitLabel="Crear orden"
      submitDisabled
      size="md"
    >
      <JefeBodegaModalSection icon={MapPin} label="Destino de la orden">
        <PolariaFormInput
          id="jefe-transfer-destino"
          label=""
          value="Bodega (mapa interno)"
          readOnly
          aria-label="Destino de la orden"
          fieldClassName="[&>label]:sr-only"
        />
      </JefeBodegaModalSection>

      <JefeBodegaModalSection icon={Box} label="Origen">
        <JefeBodegaModalSearchField
          id="jefe-transfer-origen"
          value="Bodega (casillero ocupado)"
          placeholder="Seleccionar origen"
        />
      </JefeBodegaModalSection>

      <JefeBodegaModalSection icon={Package} label="Caja en bodega">
        <JefeBodegaModalSearchField
          id="jefe-transfer-caja"
          placeholder="Sin cajas disponibles"
        />
        <JefeBodegaModalHint>
          Cajas ocupadas en el mapa que aún no tienen orden de traslado
          pendiente.
        </JefeBodegaModalHint>
      </JefeBodegaModalSection>

      <JefeBodegaModalSection icon={LayoutGrid} label="Nueva posición">
        <JefeBodegaModalSearchField
          id="jefe-transfer-posicion"
          value="Casillero 1"
          placeholder="Seleccionar casillero"
        />
      </JefeBodegaModalSection>
    </PolariaFormModal>
  );
}
