"use client";

import { Box, LayoutGrid, MapPin, Package } from "lucide-react";
import { type FormEvent, useCallback } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import {
  JefeBodegaModalHint,
  JefeBodegaModalNotice,
  JefeBodegaModalSearchField,
  JefeBodegaModalSection,
} from "./jefe-bodega-modal-ui";

interface JefeBodegaSalidaModalProps {
  open: boolean;
  onClose: () => void;
}

export function JefeBodegaSalidaModal({ open, onClose }: JefeBodegaSalidaModalProps) {
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
      title="Registrar salida"
      description="La caja pasará del almacenamiento a la zona de salida para preparar el despacho."
      onSubmit={handleSubmit}
      submitLabel="Crear salida"
      submitDisabled
      size="md"
    >
      <JefeBodegaModalSection icon={MapPin} label="Origen">
        <PolariaFormInput
          id="jefe-salida-origen"
          label=""
          value="Bodega"
          readOnly
          aria-label="Origen"
          fieldClassName="[&>label]:sr-only"
        />
      </JefeBodegaModalSection>

      <JefeBodegaModalSection icon={Package} label="Caja en bodega">
        <JefeBodegaModalSearchField
          id="jefe-salida-caja"
          placeholder="Sin cajas disponibles"
        />
        <JefeBodegaModalNotice>
          No hay cajas en bodega para enviar a salida, o ya tienen una orden
          asignada.
        </JefeBodegaModalNotice>
        <JefeBodegaModalHint>
          Solo cajas del almacenamiento sin orden pendiente hacia salida.
        </JefeBodegaModalHint>
      </JefeBodegaModalSection>

      <JefeBodegaModalSection icon={LayoutGrid} label="Posición en salida">
        <PolariaFormInput
          id="jefe-salida-posicion"
          label=""
          value="1"
          readOnly
          aria-label="Posición en salida"
          fieldClassName="[&>label]:sr-only"
        />
        <JefeBodegaModalHint>
          Cupos en la columna de salida; se asigna automáticamente según
          disponibilidad.
        </JefeBodegaModalHint>
      </JefeBodegaModalSection>
    </PolariaFormModal>
  );
}
