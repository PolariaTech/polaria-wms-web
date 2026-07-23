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
import { CuentaAssignPickerModal } from "@/modules/configurator/bodega-interna/components/CuentaAssignPickerModal";
import { createBodegaExternaConfigurator } from "../services/bodegas-externas.service";
import {
  listCuentasAssignOptions,
  type CuentaAssignOption,
} from "@/modules/configurator/usuarios/services/usuarios.service";

interface BodegaExternaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  codigoCuenta: "",
  nombre: "",
  capacidad: "",
};

export function BodegaExternaCreateModal({
  open,
  onClose,
  onCreated,
}: BodegaExternaCreateModalProps) {
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
      await createBodegaExternaConfigurator({
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
          : "No se pudo crear la bodega externa.",
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
        sectionLabel="Nueva bodega externa"
        title="Crear bodega externa"
        description="Completa los campos para registrar una bodega externa."
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        error={error}
        isSubmitting={isSubmitting}
        submitLabel="Crear"
      >
        <PolariaFormField id="bodega-externa-cuenta" label="Cuenta destino">
          <JefeBodegaModalSearchField
            id="bodega-externa-cuenta"
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
          id="bodega-externa-nombre"
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
          id="bodega-externa-capacidad"
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
