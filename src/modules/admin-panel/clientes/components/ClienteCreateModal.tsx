"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/form/PolariaPhoneInput";
import { isValidInternationalPhone } from "@/constants/ui/phone-countries";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { createClienteAdmin } from "../services/clientes.service";

interface ClienteCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  nombre: "",
  nit: "",
  telefono: "",
};

export function ClienteCreateModal({
  open,
  onClose,
  onCreated,
}: ClienteCreateModalProps) {
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

      await createClienteAdmin({
        codigoCuenta,
        nombre: form.nombre,
        nit: form.nit,
        telefono: form.telefono,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear el cliente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nuevo cliente"
      title="Crear cliente"
      description="Completa los datos del cliente para tu cuenta."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear"
      compact
    >
      <PolariaFormInput
        id="cliente-nombre"
        label="Nombre"
        value={form.nombre}
        placeholder="Nombre o razón social del cliente"
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

      <PolariaFormInput
        id="cliente-nit"
        label="NIT"
        value={form.nit}
        placeholder="900123456-7"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            nit: event.target.value,
          }))
        }
        disabled={isSubmitting}
        compact
      />

      <PolariaPhoneInput
        id="cliente-telefono"
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
