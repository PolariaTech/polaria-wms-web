"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
  PolariaFormSelect,
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
import {
  updateCamionAdmin,
  type CamionListRow,
} from "../services/camiones.service";
import {
  buildCamionEditFormValues,
  parseOptionalNumberInput,
  type CamionPickerKind,
} from "./camion-modal.helpers";
import { CamionTemperaturaSlider } from "./CamionTemperaturaSlider";
import { CamionVehiculoPickers } from "./CamionVehiculoPickers";

interface CamionEditModalProps {
  open: boolean;
  camion: CamionListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function CamionEditModal({
  open,
  camion,
  onClose,
  onUpdated,
}: CamionEditModalProps) {
  const { codigoCuenta } = useCompany();
  const [placa, setPlaca] = useState("");
  const [marcaId, setMarcaId] = useState("");
  const [marca, setMarca] = useState("");
  const [modeloId, setModeloId] = useState("");
  const [modelo, setModelo] = useState("");
  const [capacidadKg, setCapacidadKg] = useState("");
  const [capacidadM3, setCapacidadM3] = useState("");
  const [capacidadPallets, setCapacidadPallets] = useState("");
  const [tipo, setTipo] = useState<CamionTipo>("refrigerado");
  const [tempMin, setTempMin] = useState(-25);
  const [tempMax, setTempMax] = useState(15);
  const [disponible, setDisponible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [picker, setPicker] = useState<CamionPickerKind>(null);
  const [segmentoFilter, setSegmentoFilter] = useState("");

  useEffect(() => {
    if (!open || !camion) return;

    const values = buildCamionEditFormValues(camion);

    setPlaca(values.placa);
    setMarcaId(values.marcaId);
    setMarca(values.marca);
    setModeloId(values.modeloId);
    setModelo(values.modelo);
    setCapacidadKg(values.capacidadKg);
    setCapacidadM3(values.capacidadM3);
    setCapacidadPallets(values.capacidadPallets);
    setTipo(values.tipo);
    setTempMin(values.tempMin);
    setTempMax(values.tempMax);
    setDisponible(values.disponible);
    setError(null);
    setIsSubmitting(false);
    setPicker(null);
    setSegmentoFilter("");
  }, [camion, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const tipoLabel = getCamionTipoCatalogItem(tipo)?.label ?? tipo;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!camion) return;

    setError(null);

    if (!codigoCuenta) {
      setError("No se encontró la cuenta activa.");
      return;
    }

    if (!marca.trim()) {
      setError("Selecciona la marca del vehículo.");
      return;
    }

    if (!modelo.trim()) {
      setError("Selecciona el modelo del vehículo.");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCamionAdmin({
        codigoCuenta,
        idCamion: camion.idCamion,
        placa,
        marca,
        modelo,
        capacidadKg: parseOptionalNumberInput(capacidadKg),
        capacidadM3: parseOptionalNumberInput(capacidadM3),
        capacidadPallets: parseOptionalNumberInput(capacidadPallets),
        tipo,
        rangoTemperatura: formatRangoTemperatura(tempMin, tempMax),
        disponible,
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo actualizar el camión.",
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
        sectionLabel="Editar camión"
        title="Editar camión"
        description="Actualiza la información del vehículo de transporte."
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
          id="edit-camion-codigo"
          label="Código"
          value={camion?.codigo ?? ""}
          readOnly
          disabled
          compact
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PolariaFormInput
            id="edit-camion-placa"
            label="Placa"
            value={placa}
            placeholder="ABC123"
            onChange={(event) => setPlaca(event.target.value.toUpperCase())}
            disabled={isSubmitting}
            autoFocus
            compact
          />

          <PolariaFormField id="edit-camion-marca" label="Marca" compact>
            <JefeBodegaModalSearchField
              id="edit-camion-marca"
              value={marca}
              placeholder="Selecciona una marca"
              ariaLabel="Marca"
              onSearchClick={() => {
                if (!isSubmitting) setPicker("marca");
              }}
            />
          </PolariaFormField>

          <PolariaFormField id="edit-camion-modelo" label="Modelo" compact>
            <JefeBodegaModalSearchField
              id="edit-camion-modelo"
              value={modelo}
              placeholder={
                marcaId ? "Selecciona un modelo" : "Primero elige una marca"
              }
              ariaLabel="Modelo"
              onSearchClick={
                !isSubmitting && marcaId
                  ? () => setPicker("modelo")
                  : undefined
              }
            />
          </PolariaFormField>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PolariaFormInput
            id="edit-camion-peso-max"
            label="Peso máx (kg)"
            type="text"
            inputMode="decimal"
            value={capacidadKg}
            placeholder="0"
            onChange={(event) => setCapacidadKg(event.target.value)}
            disabled={isSubmitting}
            compact
          />

          <PolariaFormInput
            id="edit-camion-volumen"
            label="Volumen (m³)"
            type="text"
            inputMode="decimal"
            value={capacidadM3}
            placeholder="0"
            onChange={(event) => setCapacidadM3(event.target.value)}
            disabled={isSubmitting}
            compact
          />

          <PolariaFormInput
            id="edit-camion-pallets"
            label="Cap. pallets"
            type="text"
            inputMode="numeric"
            value={capacidadPallets}
            placeholder="0"
            onChange={(event) => setCapacidadPallets(event.target.value)}
            disabled={isSubmitting}
            compact
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <PolariaFormField
            id="edit-camion-tipo"
            label="Tipo de vehículo"
            compact
          >
            <JefeBodegaModalSearchField
              id="edit-camion-tipo"
              value={tipoLabel}
              placeholder="Selecciona el tipo"
              ariaLabel="Tipo de vehículo"
              onSearchClick={() => {
                if (!isSubmitting) setPicker("tipo");
              }}
            />
          </PolariaFormField>

          <PolariaFormSelect
            id="edit-camion-disponible"
            label="Estado"
            value={disponible ? "si" : "no"}
            options={[
              { value: "si", label: "Disponible" },
              { value: "no", label: "No disponible" },
            ]}
            onChange={(event) => setDisponible(event.target.value === "si")}
            disabled={isSubmitting}
            compact
          />
        </div>

        <CamionTemperaturaSlider
          tempMin={tempMin}
          tempMax={tempMax}
          disabled={isSubmitting}
          onChange={({ tempMin: nextMin, tempMax: nextMax }) => {
            setTempMin(nextMin);
            setTempMax(nextMax);
          }}
        />
      </PolariaFormModal>

      <CamionVehiculoPickers
        picker={picker}
        onClose={() => setPicker(null)}
        segmentoFilter={segmentoFilter}
        onSegmentoFilterChange={setSegmentoFilter}
        marcaId={marcaId}
        marca={marca}
        modeloId={modeloId}
        tipo={tipo}
        onSelectMarca={(nextMarca) => {
          setMarcaId(nextMarca.id);
          setMarca(nextMarca.nombre);
          setModeloId("");
          setModelo("");
        }}
        onSelectModelo={(nextModelo) => {
          setModeloId(nextModelo.id);
          setModelo(nextModelo.nombre);
        }}
        onSelectTipo={(nextTipo) => {
          setTipo(nextTipo.value);
          setTempMin(nextTipo.tempMinDefault);
          setTempMax(nextTipo.tempMaxDefault);
        }}
      />
    </>
  );
}
