"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/PolariaFormModal";
import { DomainServiceError } from "@/lib/domain-service-error";
import { useCompany } from "@/providers/CompanyProvider";
import { createPlantaAdmin } from "../services/plantas.service";

interface PlantaCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  nombre: "",
  direccion: "",
  capacidadPallets: "",
  rangoTemperatura: "",
};

function parseOptionalIntegerInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function PlantaCreateModal({
  open,
  onClose,
  onCreated,
}: PlantaCreateModalProps) {
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
      await createPlantaAdmin({
        codigoCuenta,
        nombre: form.nombre,
        direccion: form.direccion,
        capacidadPallets: parseOptionalIntegerInput(form.capacidadPallets),
        rangoTemperatura: form.rangoTemperatura,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo crear la planta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Nueva planta"
      title="Crear planta"
      description="Completa la información de la planta de producción o almacenamiento."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Crear"
      compact
      className="max-w-3xl"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PolariaFormInput
          id="planta-nombre"
          label="Nombre"
          value={form.nombre}
          placeholder="Planta Norte"
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
          id="planta-direccion"
          label="Dirección"
          value={form.direccion}
          placeholder="Calle 100 # 20-30"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              direccion: event.target.value,
            }))
          }
          disabled={isSubmitting}
          compact
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PolariaFormInput
          id="planta-pallets"
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

        <PolariaFormInput
          id="planta-rango-termico"
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
