"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PolariaFormInput } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  updatePlantaAdmin,
  type PlantaListRow,
} from "../services/plantas.service";

interface PlantaEditModalProps {
  open: boolean;
  planta: PlantaListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

function parseOptionalIntegerInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function PlantaEditModal({
  open,
  planta,
  onClose,
  onUpdated,
}: PlantaEditModalProps) {
  const { codigoCuenta } = useCompany();
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [capacidadPallets, setCapacidadPallets] = useState("");
  const [rangoTemperatura, setRangoTemperatura] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !planta) return;

    setNombre(planta.nombre);
    setDireccion(planta.direccion);
    setCapacidadPallets(
      planta.capacidadPallets != null ? String(planta.capacidadPallets) : "",
    );
    setRangoTemperatura(planta.rangoTemperatura ?? "");
    setError(null);
    setIsSubmitting(false);
  }, [open, planta]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!planta) return;

    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePlantaAdmin({
        codigoCuenta,
        idPlanta: planta.idPlanta,
        nombre,
        direccion,
        capacidadPallets: parseOptionalIntegerInput(capacidadPallets),
        rangoTemperatura,
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar la planta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      sectionLabel="Editar planta"
      title="Editar planta"
      description="Actualiza la información de la planta."
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel="Guardar"
      compact
      size="xl"
    >
      <PolariaFormInput
        id="edit-planta-codigo"
        label="Código"
        value={planta?.codigo ?? ""}
        readOnly
        disabled
        compact
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PolariaFormInput
          id="edit-planta-nombre"
          label="Nombre"
          value={nombre}
          placeholder="Planta Norte"
          onChange={(event) => setNombre(event.target.value)}
          disabled={isSubmitting}
          autoFocus
          compact
        />

        <PolariaFormInput
          id="edit-planta-direccion"
          label="Dirección"
          value={direccion}
          placeholder="Calle 100 # 20-30"
          onChange={(event) => setDireccion(event.target.value)}
          disabled={isSubmitting}
          compact
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PolariaFormInput
          id="edit-planta-pallets"
          label="Cap. pallets"
          type="number"
          min="0"
          step="1"
          value={capacidadPallets}
          placeholder="0"
          onChange={(event) => setCapacidadPallets(event.target.value)}
          disabled={isSubmitting}
          compact
        />

        <PolariaFormInput
          id="edit-planta-rango-termico"
          label="Rango térmico"
          value={rangoTemperatura}
          placeholder="Ej. -18°C a 4°C"
          onChange={(event) => setRangoTemperatura(event.target.value)}
          disabled={isSubmitting}
          compact
        />
      </div>
    </PolariaFormModal>
  );
}
