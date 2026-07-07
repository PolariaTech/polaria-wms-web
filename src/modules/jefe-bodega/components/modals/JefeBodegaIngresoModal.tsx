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

interface JefeBodegaIngresoModalProps {
  open: boolean;
  onClose: () => void;
}

export function JefeBodegaIngresoModal({
  open,
  onClose,
}: JefeBodegaIngresoModalProps) {
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
      title="Registrar entrada"
      description="Generar orden de ingreso"
      onSubmit={handleSubmit}
      submitLabel="Crear ingreso"
      submitDisabled
      size="md"
    >
      <JefeBodegaModalSection icon={MapPin} label="Origen">
        <PolariaFormInput
          id="jefe-ingreso-origen"
          label=""
          value="Ingresos"
          readOnly
          aria-label="Origen"
          fieldClassName="[&>label]:sr-only"
        />
      </JefeBodegaModalSection>

      <JefeBodegaModalSection icon={Package} label="Caja en ingresos">
        <JefeBodegaModalSearchField
          id="jefe-ingreso-caja"
          placeholder="Sin cajas disponibles"
        />
        <JefeBodegaModalNotice>
          No hay cajas en ingreso. Cuando el custodio registre mercancía, vas a
          poder elegirla acá.
        </JefeBodegaModalNotice>
        <JefeBodegaModalHint>
          Solo aparecen cajas que aún no tienen una orden pendiente hacia
          bodega.
        </JefeBodegaModalHint>
      </JefeBodegaModalSection>

      <JefeBodegaModalSection icon={LayoutGrid} label="Posición en bodega">
        <JefeBodegaModalSearchField
          id="jefe-ingreso-posicion"
          value="Casillero 1"
          placeholder="Seleccionar casillero"
        />
        <JefeBodegaModalHint>
          El operario ubicará la caja en el casillero que elijas.
        </JefeBodegaModalHint>
      </JefeBodegaModalSection>
    </PolariaFormModal>
  );
}
