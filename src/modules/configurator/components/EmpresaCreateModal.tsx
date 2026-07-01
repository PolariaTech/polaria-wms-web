"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { PolariaPhoneInput } from "@/components/shared/PolariaPhoneInput";
import { isValidInternationalPhone } from "@/constants/phone-countries";
import { DomainServiceError } from "@/lib/domain-service-error";
import {
  generateCodigoCuentaFromNombre,
  normalizeCodigoCuentaInput,
} from "@/lib/generate-codigo-cuenta";
import { useAuthStore } from "@/stores/auth.store";
import { createEmpresaConfigurator } from "../services/empresas.service";

interface EmpresaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  razonSocial: "",
  codigoEmpresa: "",
  telefono: "",
};

export function EmpresaCreateModal({
  open,
  onClose,
  onCreated,
}: EmpresaCreateModalProps) {
  const idCreador = useAuthStore((state) => state.session?.idUsuario ?? null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [codigoManual, setCodigoManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(INITIAL_FORM);
    setCodigoManual(false);
    setError(null);
    setIsSubmitting(false);
  }, [open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleRazonSocialChange = (value: string) => {
    setForm((current) => ({
      ...current,
      razonSocial: value,
      codigoEmpresa: codigoManual
        ? current.codigoEmpresa
        : generateCodigoCuentaFromNombre(value),
    }));
  };

  const handleCodigoChange = (value: string) => {
    setCodigoManual(true);
    setForm((current) => ({
      ...current,
      codigoEmpresa: normalizeCodigoCuentaInput(value),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (form.telefono.trim() && !isValidInternationalPhone(form.telefono)) {
        setError("Ingresa un número de teléfono válido.");
        setIsSubmitting(false);
        return;
      }

      await createEmpresaConfigurator({
        razonSocial: form.razonSocial,
        codigoEmpresa: form.codigoEmpresa,
        telefono: form.telefono,
        idCreador,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear la empresa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nueva empresa"
      title="Crear empresa"
      description="Completa los campos para registrar una empresa."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear"
    >
      <PolariaFormInput
        id="empresa-razon-social"
        label="Razón social"
        value={form.razonSocial}
        placeholder="Nombre legal de la empresa"
        onChange={(event) => handleRazonSocialChange(event.target.value)}
        disabled={isSubmitting}
        autoFocus
      />

      <PolariaFormInput
        id="empresa-codigo"
        label="Código empresa"
        value={form.codigoEmpresa}
        placeholder="Código generado"
        onChange={(event) => handleCodigoChange(event.target.value)}
        disabled={isSubmitting}
        hint="Se genera al escribir la razón social (base 36, 5 caracteres); puedes ajustarlo si lo necesitas."
      />

      <PolariaPhoneInput
        id="empresa-telefono"
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
      />
    </PolariaFormModal>
  );
}
