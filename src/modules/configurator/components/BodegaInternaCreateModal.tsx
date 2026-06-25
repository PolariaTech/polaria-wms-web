"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { DomainServiceError } from "@/lib/domain-service-error";
import { useAuthStore } from "@/stores/auth.store";
import { createBodegaInternaConfigurator } from "../services/bodegas-internas.service";

interface BodegaInternaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  nombre: "",
  capacidad: "",
};

export function BodegaInternaCreateModal({
  open,
  onClose,
  onCreated,
}: BodegaInternaCreateModalProps) {
  const idCreador = useAuthStore((state) => state.session?.idUsuario ?? null);
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
      await createBodegaInternaConfigurator({
        nombre: form.nombre,
        capacidad: Number(form.capacidad),
        idCreador,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear la bodega interna.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nueva bodega interna"
      title="Crear bodega interna"
      description="Completa los campos para registrar una bodega interna."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear"
    >
      <PolariaFormInput
        id="bodega-interna-id"
        label="ID único"
        value=""
        placeholder="Se genera al guardar"
        readOnly
        disabled
      />

      <PolariaFormInput
        id="bodega-interna-nombre"
        label="Nombre"
        value={form.nombre}
        placeholder="Nombre de la bodega"
        onChange={(event) =>
          setForm((current) => ({ ...current, nombre: event.target.value }))
        }
        disabled={isSubmitting}
        autoFocus
      />

      <PolariaFormInput
        id="bodega-interna-capacidad"
        label="Capacidad"
        type="number"
        min={1}
        inputMode="numeric"
        value={form.capacidad}
        placeholder="Capacidad en slots"
        onChange={(event) =>
          setForm((current) => ({ ...current, capacidad: event.target.value }))
        }
        disabled={isSubmitting}
      />
    </PolariaFormModal>
  );
}
