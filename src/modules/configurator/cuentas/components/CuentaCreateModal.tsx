"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  generateCodigoCuentaFromNombre,
  normalizeCodigoCuentaInput,
} from "@/lib/utils/generate-codigo-cuenta";
import { useAuthStore } from "@/stores/auth.store";
import {
  createCuentaConfigurator,
  listEmpresasAssignOptions,
  type EmpresaAssignOption,
} from "../services/cuentas.service";

interface CuentaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  codigoEmpresa: "",
  nombre: "",
  codigo: "",
};

export function CuentaCreateModal({
  open,
  onClose,
  onCreated,
}: CuentaCreateModalProps) {
  const idCreador = useAuthStore((state) => state.session?.idUsuario ?? null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [empresas, setEmpresas] = useState<EmpresaAssignOption[]>([]);
  const [codigoManual, setCodigoManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(INITIAL_FORM);
    setCodigoManual(false);
    setError(null);
    setIsSubmitting(false);
    setIsLoadingOptions(true);

    void listEmpresasAssignOptions()
      .then(setEmpresas)
      .catch(() => {
        setError("No se pudieron cargar las empresas.");
      })
      .finally(() => {
        setIsLoadingOptions(false);
      });
  }, [open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleNombreChange = (value: string) => {
    setForm((current) => ({
      ...current,
      nombre: value,
      codigo: codigoManual
        ? current.codigo
        : generateCodigoCuentaFromNombre(value),
    }));
  };

  const handleCodigoChange = (value: string) => {
    setCodigoManual(true);
    setForm((current) => ({
      ...current,
      codigo: normalizeCodigoCuentaInput(value),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.codigoEmpresa) {
      setError("Selecciona la empresa a asociar.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createCuentaConfigurator({
        nombreComercial: form.nombre,
        codigoCuenta: form.codigo,
        codigoEmpresa: form.codigoEmpresa,
        idCreador,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear la cuenta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const disabled = isSubmitting || isLoadingOptions;

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nueva cuenta"
      title="Crear cuenta"
      description="Completa los campos para registrar una cuenta."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear"
    >
      <PolariaFormInput
        id="cuenta-id-automatico"
        label="ID automático"
        value=""
        placeholder="Se genera al guardar"
        readOnly
        disabled
      />

      <PolariaFormSelect
        id="cuenta-empresa"
        label="Empresa"
        value={form.codigoEmpresa}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            codigoEmpresa: event.target.value,
          }))
        }
        disabled={disabled}
        placeholder="Selecciona una empresa"
        options={empresas.map((empresa) => ({
          value: empresa.codigoEmpresa,
          label: `${empresa.razonSocial} (${empresa.codigoEmpresa})`,
        }))}
      />

      <PolariaFormInput
        id="cuenta-nombre"
        label="Nombre"
        value={form.nombre}
        placeholder="Nombre de la cuenta"
        onChange={(event) => handleNombreChange(event.target.value)}
        disabled={disabled}
        autoFocus
      />

      <PolariaFormInput
        id="cuenta-codigo"
        label="Código"
        value={form.codigo}
        placeholder="Código generado"
        onChange={(event) => handleCodigoChange(event.target.value)}
        disabled={disabled}
        hint="Se genera al escribir el nombre (base 36, 5 caracteres); puedes ajustarlo si lo necesitas."
      />
    </PolariaFormModal>
  );
}
