"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/PolariaPhoneInput";
import { isValidInternationalPhone } from "@/constants/phone-countries";
import { DomainServiceError } from "@/lib/domain-service-error";
import { useCompany } from "@/providers/CompanyProvider";
import { createProveedorAdmin } from "../services/proveedores.service";

interface ProveedorCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  proveedor: "",
  nombre: "",
  telefono: "",
  email: "",
};

export function ProveedorCreateModal({
  open,
  onClose,
  onCreated,
}: ProveedorCreateModalProps) {
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

    if (!isValidInternationalPhone(form.telefono)) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createProveedorAdmin({
        codigoCuenta,
        proveedor: form.proveedor,
        nombre: form.nombre,
        telefono: form.telefono,
        email: form.email,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear el proveedor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nuevo proveedor"
      title="Crear proveedor"
      description="Completa los datos del proveedor para tu cuenta."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear"
      compact
    >
      <PolariaFormInput
        id="proveedor-empresa"
        label="Proveedor"
        value={form.proveedor}
        placeholder="Nombre de la empresa proveedora"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            proveedor: event.target.value,
          }))
        }
        disabled={isSubmitting}
        autoFocus
        compact
      />

      <PolariaFormInput
        id="proveedor-nombre"
        label="Nombre"
        value={form.nombre}
        placeholder="Nombre de contacto"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            nombre: event.target.value,
          }))
        }
        disabled={isSubmitting}
        compact
      />

      <PolariaPhoneInput
        id="proveedor-telefono"
        label="Teléfono"
        value={form.telefono}
        onChange={(telefono) =>
          setForm((current) => ({
            ...current,
            telefono,
          }))
        }
        disabled={isSubmitting}
        compact
      />

      <PolariaFormInput
        id="proveedor-email"
        label="Email"
        type="email"
        value={form.email}
        placeholder="correo@proveedor.com"
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            email: event.target.value,
          }))
        }
        disabled={isSubmitting}
        compact
      />
    </PolariaFormModal>
  );
}
