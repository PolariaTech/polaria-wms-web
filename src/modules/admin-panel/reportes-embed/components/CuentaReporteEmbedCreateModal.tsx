"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { createCuentaReporteEmbedAdmin } from "../services/cuenta-reporte-embed-gestion.client";
import {
  CuentaReporteEmbedFormFields,
  type CuentaReporteEmbedFormValues,
} from "./CuentaReporteEmbedFormFields";

interface CuentaReporteEmbedCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM: CuentaReporteEmbedFormValues = {
  descripcion: "",
  embedUrl: "",
  estaActivo: true,
};

export function CuentaReporteEmbedCreateModal({
  open,
  onClose,
  onCreated,
}: CuentaReporteEmbedCreateModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(INITIAL_FORM);
    setError(null);
    setIsSubmitting(false);
  }, [open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createCuentaReporteEmbedAdmin({
        descripcion: form.descripcion,
        embedUrl: form.embedUrl,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el reporte.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Reportes"
      title="Cargar reporte"
      description="Pega la URL y un nombre para identificarlo en la cuenta."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar"
      compact
      size="md"
    >
      <CuentaReporteEmbedFormFields
        idPrefix="reporte-embed"
        values={form}
        disabled={isSubmitting}
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
      />
    </PolariaFormModal>
  );
}
