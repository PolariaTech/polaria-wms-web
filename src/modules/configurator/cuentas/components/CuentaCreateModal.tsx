"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { PolariaFormField, PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { generateCodigoCuentaFromNombre } from "@/lib/utils/generate-codigo-cuenta";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { useAuthStore } from "@/stores/auth.store";
import {
  createCuentaConfigurator,
  listEmpresasAssignOptions,
  type EmpresaAssignOption,
} from "../services/cuentas.service";
import { EmpresaAssignPickerModal } from "./EmpresaAssignPickerModal";

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(INITIAL_FORM);
    setPickerOpen(false);
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
      codigo: generateCodigoCuentaFromNombre(value),
    }));
  };

  const empresaLabel = useMemo(() => {
    if (!form.codigoEmpresa) return "";
    const selected = empresas.find(
      (empresa) => empresa.codigoEmpresa === form.codigoEmpresa,
    );
    if (!selected) return form.codigoEmpresa;
    return `${selected.razonSocial} (${selected.codigoEmpresa})`;
  }, [empresas, form.codigoEmpresa]);

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
    <>
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
        hideHeaderClose
      >
        <PolariaFormField id="cuenta-empresa" label="Empresa">
          <JefeBodegaModalSearchField
            id="cuenta-empresa"
            value={empresaLabel}
            placeholder={
              isLoadingOptions
                ? "Cargando empresas…"
                : "Selecciona una empresa"
            }
            ariaLabel="Empresa"
            onSearchClick={
              disabled
                ? undefined
                : () => {
                    setPickerOpen(true);
                  }
            }
          />
        </PolariaFormField>

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
          readOnly
          disabled
        />
      </PolariaFormModal>

      <EmpresaAssignPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        empresas={empresas}
        selectedCodigo={form.codigoEmpresa || null}
        onSelect={(empresa) => {
          setForm((current) => ({
            ...current,
            codigoEmpresa: empresa.codigoEmpresa,
          }));
          setError(null);
        }}
      />
    </>
  );
}
