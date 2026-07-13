"use client";

import { Cpu, Send } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { formatKilos } from "@/modules/processing/shared/constants/processing-status";
import { useJefeBodegaOperarioAsignacion } from "../../hooks/useJefeBodegaOperarioAsignacion";
import { asignarOperarioProcesamientoJefe } from "../../services/jefe-bodega-procesamiento.service";
import type { JefeBodegaProcesamientoSolicitudPrefill } from "../../types/jefe-bodega-procesamiento.types";
import {
  JefeBodegaModalHint,
  JefeBodegaModalSection,
} from "./jefe-bodega-modal-ui";
import { JefeBodegaOperarioPicker } from "./JefeBodegaOperarioPicker";

interface Props {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  idBodega: string | null;
  prefill: JefeBodegaProcesamientoSolicitudPrefill | null;
  onAssigned?: () => void;
}

export function JefeBodegaProcesamientoAsignarModal({
  open,
  onClose,
  codigoCuenta,
  idBodega,
  prefill,
  onAssigned,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const operarioAsignacion = useJefeBodegaOperarioAsignacion({
    open,
    codigoCuenta,
    idBodega,
  });

  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const canSubmit =
    Boolean(prefill?.idSolicitudProcesamiento) &&
    Boolean(codigoCuenta?.trim()) &&
    Boolean(idBodega?.trim()) &&
    operarioAsignacion.canAssign &&
    !isSubmitting;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !prefill || !codigoCuenta?.trim() || !idBodega?.trim()) {
      return;
    }

    const idOperario = operarioAsignacion.idAsignado;
    if (!idOperario) {
      setError(operarioAsignacion.blockReason ?? "Selecciona un operario.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await asignarOperarioProcesamientoJefe({
        idSolicitudProcesamiento: prefill.idSolicitudProcesamiento,
        codigoCuenta: codigoCuenta.trim(),
        idBodega: idBodega.trim(),
        idOperario,
      });
      onAssigned?.();
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo asignar el operario a la orden.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Asignar retiro en bodega"
      description="El operario moverá el insumo desde almacenamiento hacia la zona de procesamiento."
      onSubmit={handleSubmit}
      submitLabel="Asignar operario"
      submitDisabled={!canSubmit}
      hideHeaderClose
      size="md"
    >
      <JefeBodegaModalSection icon={Cpu} label="Orden de procesamiento">
        {prefill ? (
          <div className="space-y-2 rounded-xl border border-polaria-t-20 bg-polaria-w-08 px-4 py-3">
            <p className="polaria-text-body-sm font-semibold text-polaria-w">
              {prefill.codigo}
            </p>
            <p className="polaria-text-caption text-polaria-w-50">
              {prefill.primarioLabel} → {prefill.secundarioLabel}
            </p>
            <p className="polaria-text-caption text-polaria-teal">
              Cantidad: {formatKilos(prefill.kilosPrimario)}
            </p>
          </div>
        ) : (
          <JefeBodegaModalHint>
            Selecciona una solicitud pendiente desde el panel de procesamiento.
          </JefeBodegaModalHint>
        )}
      </JefeBodegaModalSection>

      <JefeBodegaModalSection
        icon={Send}
        label="Retiro en bodega"
        hint="La tarea pasará a la cola del operario asignado."
      >
        <JefeBodegaOperarioPicker asignacion={operarioAsignacion} />
      </JefeBodegaModalSection>

      {error ? (
        <p role="alert" className="polaria-text-body-sm text-polaria-danger">
          {error}
        </p>
      ) : null}
    </PolariaFormModal>
  );
}
