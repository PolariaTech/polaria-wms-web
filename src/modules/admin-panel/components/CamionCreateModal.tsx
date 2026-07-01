"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  PolariaFormInput,
  PolariaFormSelect,
} from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { DomainServiceError } from "@/lib/domain-service-error";
import { useCompany } from "@/providers/CompanyProvider";
import {
  CAMION_TIPO_OPTIONS,
  type CamionTipo,
} from "../constants/camion-types";
import { createCamionAdmin } from "../services/camiones.service";

interface CamionCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  placa: "",
  marca: "",
  modelo: "",
  capacidadKg: "",
  capacidadM3: "",
  capacidadPallets: "",
  tipo: "refrigerado" as CamionTipo,
  rangoTemperatura: "",
};

function parseOptionalNumberInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function CamionCreateModal({
  open,
  onClose,
  onCreated,
}: CamionCreateModalProps) {
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
      await createCamionAdmin({
        codigoCuenta,
        placa: form.placa,
        marca: form.marca,
        modelo: form.modelo,
        capacidadKg: parseOptionalNumberInput(form.capacidadKg),
        capacidadM3: parseOptionalNumberInput(form.capacidadM3),
        capacidadPallets: parseOptionalNumberInput(form.capacidadPallets),
        tipo: form.tipo,
        rangoTemperatura: form.rangoTemperatura,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear el camión.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nuevo camión"
      title="Crear camión"
      description="Completa la información del vehículo de transporte."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear"
      compact
      size="xl"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <PolariaFormInput
          id="camion-placa"
          label="Placa"
          value={form.placa}
          placeholder="ABC123"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              placa: event.target.value.toUpperCase(),
            }))
          }
          disabled={isSubmitting}
          autoFocus
          compact
        />

        <PolariaFormInput
          id="camion-marca"
          label="Marca"
          value={form.marca}
          placeholder="Marca"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              marca: event.target.value,
            }))
          }
          disabled={isSubmitting}
          compact
        />

        <PolariaFormInput
          id="camion-modelo"
          label="Modelo"
          value={form.modelo}
          placeholder="Modelo"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              modelo: event.target.value,
            }))
          }
          disabled={isSubmitting}
          compact
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <PolariaFormInput
          id="camion-peso-max"
          label="Peso máx (kg)"
          type="number"
          min="0"
          step="0.01"
          value={form.capacidadKg}
          placeholder="0"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              capacidadKg: event.target.value,
            }))
          }
          disabled={isSubmitting}
          compact
        />

        <PolariaFormInput
          id="camion-volumen"
          label="Volumen (m³)"
          type="number"
          min="0"
          step="0.01"
          value={form.capacidadM3}
          placeholder="0"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              capacidadM3: event.target.value,
            }))
          }
          disabled={isSubmitting}
          compact
        />

        <PolariaFormInput
          id="camion-pallets"
          label="Cap. pallets"
          type="number"
          min="0"
          step="1"
          value={form.capacidadPallets}
          placeholder="0"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              capacidadPallets: event.target.value,
            }))
          }
          disabled={isSubmitting}
          compact
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PolariaFormSelect
          id="camion-tipo"
          label="Tipo de vehículo"
          value={form.tipo}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              tipo: event.target.value as CamionTipo,
            }))
          }
          disabled={isSubmitting}
          options={CAMION_TIPO_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          compact
        />

        <PolariaFormInput
          id="camion-rango-termico"
          label="Rango térmico"
          value={form.rangoTemperatura}
          placeholder="Ej. -18°C a 4°C"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              rangoTemperatura: event.target.value,
            }))
          }
          disabled={isSubmitting}
          compact
        />
      </div>
    </PolariaFormModal>
  );
}
