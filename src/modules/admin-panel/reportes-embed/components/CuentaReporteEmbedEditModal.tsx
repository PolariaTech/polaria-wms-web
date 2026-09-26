"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { updateCuentaReporteEmbedAdmin } from "../services/cuenta-reporte-embed-gestion.client";
import type { CuentaReporteEmbedAdminRow } from "../services/cuenta-reporte-embed-gestion.client";
import { validateCuentaReporteEmbedForm } from "../utils/validate-cuenta-reporte-embed-form";
import {
  CuentaReporteEmbedFormFields,
  type CuentaReporteEmbedFormValues,
} from "./CuentaReporteEmbedFormFields";

interface CuentaReporteEmbedEditModalProps {
  open: boolean;
  reporte: CuentaReporteEmbedAdminRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

const EMPTY_FORM: CuentaReporteEmbedFormValues = {
  descripcion: "",
  embedUrl: "",
  estaActivo: true,
};

export function CuentaReporteEmbedEditModal({
  open,
  reporte,
  onClose,
  onUpdated,
}: CuentaReporteEmbedEditModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !reporte) return;
    setForm({
      descripcion: reporte.descripcion?.trim() ?? "",
      embedUrl: reporte.embedUrl,
      estaActivo: reporte.estaActivo,
    });
    setError(null);
    setIsSubmitting(false);
  }, [open, reporte]);

  const isDirty = useMemo(() => {
    if (!reporte) return false;
    return (
      form.descripcion.trim() !== (reporte.descripcion?.trim() ?? "") ||
      form.embedUrl.trim() !== reporte.embedUrl.trim() ||
      form.estaActivo !== reporte.estaActivo
    );
  }, [form, reporte]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reporte) return;

    setError(null);

    const validationError = validateCuentaReporteEmbedForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCuentaReporteEmbedAdmin({
        id: reporte.id,
        descripcion: form.descripcion,
        embedUrl: form.embedUrl,
        estaActivo: form.estaActivo,
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el reporte.",
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
      title="Editar reporte"
      description="Cambia el nombre, la URL o el estado. El identificador interno se mantiene."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar cambios"
      compact
      size="md"
      closeOnBackdrop={!isDirty && !isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <CuentaReporteEmbedFormFields
        idPrefix="edit-reporte-embed"
        values={form}
        disabled={isSubmitting}
        showEstado
        onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
      />
    </PolariaFormModal>
  );
}
