"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PolariaFormField,
  PolariaFormInput,
} from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { JefeBodegaModalSearchField } from "@/modules/jefe-bodega/components/modals/jefe-bodega-modal-ui";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  CAMION_TIPO_CATALOG,
  formatRangoTemperatura,
  getCamionTipoCatalogItem,
} from "../catalog/camion-tipo-temperatura";
import {
  CAMION_MARCAS_CATALOG,
  CAMION_SEGMENTO_LABEL,
  getCamionMarcaById,
  listModelosByMarcaId,
  type CamionMarcaCatalogItem,
  type CamionModeloCatalogItem,
  type CamionSegmentoCatalog,
} from "../catalog/camion-vehiculos.catalog";
import type { CamionTipo } from "../constants/camion-types";
import { createCamionAdmin } from "../services/camiones.service";
import { CamionCatalogTablePickerModal } from "./CamionCatalogTablePickerModal";
import { CamionTemperaturaSlider } from "./CamionTemperaturaSlider";

interface CamionCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type PickerKind = "marca" | "modelo" | "tipo" | null;

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
  const [picker, setPicker] = useState<PickerKind>(null);
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

  const marcasFiltradas = useMemo(() => {
    if (!segmentoFilter) return CAMION_MARCAS_CATALOG;
    return CAMION_MARCAS_CATALOG.filter(
      (marca) => marca.segmento === segmentoFilter,
    );
  }, [segmentoFilter]);

  const modelosDeMarca = useMemo(() => {
    if (!form.marcaId) return [];
    return listModelosByMarcaId(form.marcaId);
  }, [form.marcaId]);

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

  const segmentoOptions = (
    Object.entries(CAMION_SEGMENTO_LABEL) as [CamionSegmentoCatalog, string][]
  ).map(([value, label]) => ({ value, label }));

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

      <CamionCatalogTablePickerModal
        open={picker === "marca"}
        onClose={() => setPicker(null)}
        title="Seleccionar marca"
        description="Marcas de camiones de carga. Editá el catálogo en camion-vehiculos.catalog.ts."
        rows={marcasFiltradas}
        columns={[
          {
            id: "nombre",
            header: "Marca",
            cell: (row: CamionMarcaCatalogItem) => row.nombre,
          },
          {
            id: "origen",
            header: "Origen",
            cell: (row) => row.origen,
            className: "text-polaria-w-50",
          },
          {
            id: "segmento",
            header: "Segmento",
            cell: (row) => CAMION_SEGMENTO_LABEL[row.segmento],
          },
        ]}
        getRowKey={(row) => row.id}
        getSearchHaystack={(row) =>
          `${row.nombre} ${row.origen} ${CAMION_SEGMENTO_LABEL[row.segmento]}`
        }
        selectedKey={form.marcaId || null}
        searchPlaceholder="Buscar marca u origen"
        filterLabel="Segmento"
        filterOptions={segmentoOptions}
        filterValue={segmentoFilter}
        onFilterChange={setSegmentoFilter}
        onSelect={(marca) => {
          setForm((current) => ({
            ...current,
            marcaId: marca.id,
            marca: marca.nombre,
            modeloId: "",
            modelo: "",
          }));
        }}
      />

      <CamionCatalogTablePickerModal
        open={picker === "modelo"}
        onClose={() => setPicker(null)}
        title={`Modelos · ${form.marca || "marca"}`}
        description={`Modelos de ${getCamionMarcaById(form.marcaId)?.nombre ?? "la marca"}. Actualizá en camion-vehiculos.catalog.ts.`}
        rows={modelosDeMarca}
        columns={[
          {
            id: "nombre",
            header: "Modelo",
            cell: (row: CamionModeloCatalogItem) => row.nombre,
          },
          {
            id: "segmento",
            header: "Segmento",
            cell: (row) => CAMION_SEGMENTO_LABEL[row.segmento],
            className: "text-polaria-w-50",
          },
        ]}
        getRowKey={(row) => row.id}
        getSearchHaystack={(row) =>
          `${row.nombre} ${CAMION_SEGMENTO_LABEL[row.segmento]}`
        }
        selectedKey={form.modeloId || null}
        searchPlaceholder="Buscar modelo"
        emptyMessage="No hay modelos para esta marca en el catálogo."
        onSelect={(modelo) => {
          setForm((current) => ({
            ...current,
            modeloId: modelo.id,
            modelo: modelo.nombre,
          }));
        }}
      />

      <CamionCatalogTablePickerModal
        open={picker === "tipo"}
        onClose={() => setPicker(null)}
        title="Tipo de vehículo"
        description="Elegí el tipo; el rango térmico se puede afinar con el slider."
        rows={CAMION_TIPO_CATALOG}
        columns={[
          {
            id: "tipo",
            header: "Tipo",
            cell: (row) => row.label,
          },
          {
            id: "rango",
            header: "Rango térmico",
            cell: (row) => row.rangoTipico,
            className: "text-polaria-teal",
          },
          {
            id: "desc",
            header: "Descripción",
            cell: (row) => row.descripcion,
            className: "text-polaria-w-50",
          },
        ]}
        getRowKey={(row) => row.value}
        getSearchHaystack={(row) =>
          `${row.label} ${row.rangoTipico} ${row.descripcion}`
        }
        selectedKey={form.tipo}
        searchPlaceholder="Buscar tipo o rango"
        onSelect={(tipo) => {
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
