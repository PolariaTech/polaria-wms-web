"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/PolariaPhoneInput";
import { isValidInternationalPhone } from "@/constants/phone-countries";
import { DomainServiceError } from "@/lib/domain-service-error";
import { useCompany } from "@/providers/CompanyProvider";
import { createCompradorAdmin } from "../services/compradores.service";

interface CompradorCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  nombre: "",
  telefono: "",
};

export function CompradorCreateModal({
  open,
  onClose,
  onCreated,
}: CompradorCreateModalProps) {
  const { codigoCuenta } = useCompany();
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

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (form.telefono.trim() && !isValidInternationalPhone(form.telefono)) {
        setError("Ingresa un número de teléfono válido.");
        setIsSubmitting(false);
        return;
      }

      await createCompradorAdmin({
        codigoCuenta,
        nombre: form.nombre,
        telefono: form.telefono,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear el comprador.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nuevo comprador"
      title="Crear comprador"
      description="Ingresa el nombre del comprador para registrarlo en tu cuenta."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear"
      compact
    >
      <PolariaFormInput
        id="comprador-nombre"
        label="Nombre del comprador"
        value={form.nombre}
        placeholder="Nombre del comprador"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            nombre: event.target.value,
          }))
        }
        disabled={isSubmitting}
        autoFocus
        compact
      />

      <PolariaPhoneInput
        id="comprador-telefono"
        label="Teléfono"
        value={form.telefono}
        onChange={(value) =>
          setForm((current) => ({
            ...current,
            telefono: value,
          }))
        }
        disabled={isSubmitting}
        hint="Opcional. Formato internacional."
        compact
      />
    </PolariaFormModal>
  );
}
