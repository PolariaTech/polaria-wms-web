"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { useAuthStore } from "@/stores/auth.store";
import { createBodegaInternaConfigurator } from "../services/bodegas-internas.service";
import {
  listCuentasAssignOptions,
  type CuentaAssignOption,
} from "@/modules/configurator/usuarios/services/usuarios.service";
import { CuentaAssignPickerModal } from "./CuentaAssignPickerModal";

interface BodegaInternaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  codigoCuenta: "",
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
  const [cuentas, setCuentas] = useState<CuentaAssignOption[]>([]);
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

    void listCuentasAssignOptions()
      .then(setCuentas)
      .catch(() => {
        setError("No se pudieron cargar las cuentas.");
      })
      .finally(() => {
        setIsLoadingOptions(false);
      });
  }, [open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const cuentaLabel = useMemo(() => {
    if (!form.codigoCuenta) return "";
    const selected = cuentas.find(
      (cuenta) => cuenta.codigoCuenta === form.codigoCuenta,
    );
    if (!selected) return form.codigoCuenta;
    return `${selected.nombreComercial} (${selected.codigoCuenta})`;
  }, [cuentas, form.codigoCuenta]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.codigoCuenta) {
      setError("Selecciona la cuenta destino.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createBodegaInternaConfigurator({
        nombre: form.nombre,
        capacidad: Number(form.capacidad),
        codigoCuenta: form.codigoCuenta,
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

  const disabled = isSubmitting || isLoadingOptions;

  return (
    <>
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
        <PolariaFormField id="bodega-interna-cuenta" label="Cuenta destino">
          <JefeBodegaModalSearchField
            id="bodega-interna-cuenta"
            value={cuentaLabel}
            placeholder={
              isLoadingOptions ? "Cargando cuentas…" : "Selecciona una cuenta"
            }
            ariaLabel="Cuenta destino"
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
          id="bodega-interna-nombre"
          label="Nombre"
          value={form.nombre}
          placeholder="Nombre de la bodega"
          onChange={(event) =>
            setForm((current) => ({ ...current, nombre: event.target.value }))
          }
          disabled={disabled}
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
          disabled={disabled}
        />
      </PolariaFormModal>

      <CuentaAssignPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        cuentas={cuentas}
        selectedCodigo={form.codigoCuenta || null}
        onSelect={(cuenta) => {
          setForm((current) => ({
            ...current,
            codigoCuenta: cuenta.codigoCuenta,
          }));
          setError(null);
        }}
      />
    </>
  );
}
