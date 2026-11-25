"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  formatRangoTemperatura,
  getCamionTipoCatalogItem,
} from "../catalog/camion-tipo-temperatura";
import type { CamionTipo } from "../constants/camion-types";
import { createCamionAdmin } from "../services/camiones.service";
import {
  parseOptionalNumberInput,
  type CamionPickerKind,
} from "./camion-modal.helpers";
import { CamionTemperaturaSlider } from "./CamionTemperaturaSlider";
import { CamionVehiculoPickers } from "./CamionVehiculoPickers";

interface CamionCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const INITIAL_FORM = {
  placa: "",
  marcaId: "" as string,
  marca: "",
  modeloId: "" as string,
  modelo: "",
  capacidadKg: "",
  capacidadM3: "",
  capacidadPallets: "",
  tipo: "refrigerado" as CamionTipo,
  tempMin: -25,
  tempMax: 15,
};

export function CamionCreateModal({
  open,
  onClose,
  onCreated,
}: CamionCreateModalProps) {
  const { codigoCuenta } = useCompany();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [picker, setPicker] = useState<CamionPickerKind>(null);
  const [segmentoFilter, setSegmentoFilter] = useState("");

  useEffect(() => {
    if (!open) return;

    const refrigerado = getCamionTipoCatalogItem("refrigerado");
    setForm({
      ...INITIAL_FORM,
      tempMin: refrigerado?.tempMinDefault ?? -25,
      tempMax: refrigerado?.tempMaxDefault ?? 15,
    });
    setError(null);
    setIsSubmitting(false);
    setPicker(null);
    setSegmentoFilter("");
  }, [open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const tipoLabel =
    getCamionTipoCatalogItem(form.tipo)?.label ?? form.tipo;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    if (!form.marca.trim()) {
      setError("Selecciona la marca del vehículo.");
      return;
    }

    if (!form.modelo.trim()) {
      setError("Selecciona el modelo del vehículo.");
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
        rangoTemperatura: formatRangoTemperatura(form.tempMin, form.tempMax),
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
    <>
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

          <PolariaFormField id="camion-marca" label="Marca" compact>
            <JefeBodegaModalSearchField
              id="camion-marca"
              value={form.marca}
              placeholder="Selecciona una marca"
              ariaLabel="Marca"
              onSearchClick={() => {
                if (!isSubmitting) setPicker("marca");
              }}
            />
          </PolariaFormField>

          <PolariaFormField id="camion-modelo" label="Modelo" compact>
            <JefeBodegaModalSearchField
              id="camion-modelo"
              value={form.modelo}
              placeholder={
                form.marcaId
                  ? "Selecciona un modelo"
                  : "Primero elige una marca"
              }
              ariaLabel="Modelo"
              onSearchClick={
                !isSubmitting && form.marcaId
                  ? () => setPicker("modelo")
                  : undefined
              }
            />
          </PolariaFormField>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PolariaFormInput
            id="camion-peso-max"
            label="Peso máx (kg)"
            type="text"
            inputMode="decimal"
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
            type="text"
            inputMode="decimal"
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
            type="text"
            inputMode="numeric"
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
          <PolariaFormField
            id="camion-tipo"
            label="Tipo de vehículo"
            compact
          >
            <JefeBodegaModalSearchField
              id="camion-tipo"
              value={tipoLabel}
              placeholder="Selecciona el tipo"
              ariaLabel="Tipo de vehículo"
              onSearchClick={() => {
                if (!isSubmitting) setPicker("tipo");
              }}
            />
          </PolariaFormField>
        </div>

        <CamionTemperaturaSlider
          tempMin={form.tempMin}
          tempMax={form.tempMax}
          disabled={isSubmitting}
          onChange={({ tempMin, tempMax }) =>
            setForm((current) => ({ ...current, tempMin, tempMax }))
          }
        />
      </PolariaFormModal>

      <CamionVehiculoPickers
        picker={picker}
        onClose={() => setPicker(null)}
        segmentoFilter={segmentoFilter}
        onSegmentoFilterChange={setSegmentoFilter}
        marcaId={form.marcaId}
        marca={form.marca}
        modeloId={form.modeloId}
        tipo={form.tipo}
        onSelectMarca={(marca) => {
          setForm((current) => ({
            ...current,
            marcaId: marca.id,
            marca: marca.nombre,
            modeloId: "",
            modelo: "",
          }));
        }}
        onSelectModelo={(modelo) => {
          setForm((current) => ({
            ...current,
            modeloId: modelo.id,
            modelo: modelo.nombre,
          }));
        }}
        onSelectTipo={(tipo) => {
          setForm((current) => ({
            ...current,
            tipo: tipo.value,
            tempMin: tipo.tempMinDefault,
            tempMax: tipo.tempMaxDefault,
          }));
        }}
      />
    </>
  );
}
