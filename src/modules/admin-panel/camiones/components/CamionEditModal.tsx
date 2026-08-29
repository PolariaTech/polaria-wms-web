"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
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
  CAMION_TIPO_CATALOG,
  formatRangoTemperatura,
  getCamionTipoCatalogItem,
  parseRangoTemperatura,
} from "../catalog/camion-tipo-temperatura";
import {
  CAMION_MARCAS_CATALOG,
  CAMION_SEGMENTO_LABEL,
  getCamionMarcaById,
  listModelosByMarcaId,
  matchCamionCatalogByNombre,
  type CamionMarcaCatalogItem,
  type CamionModeloCatalogItem,
  type CamionSegmentoCatalog,
} from "../catalog/camion-vehiculos.catalog";
import {
  CAMION_TIPO_OPTIONS,
  type CamionTipo,
} from "../constants/camion-types";
import {
  updateCamionAdmin,
  type CamionListRow,
} from "../services/camiones.service";
import { CamionCatalogTablePickerModal } from "./CamionCatalogTablePickerModal";
import { CamionTemperaturaSlider } from "./CamionTemperaturaSlider";

interface CamionEditModalProps {
  open: boolean;
  camion: CamionListRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

type PickerKind = "marca" | "modelo" | "tipo" | null;

function parseOptionalNumberInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveCamionTipo(tipo: string): CamionTipo {
  const match = CAMION_TIPO_OPTIONS.find((item) => item.value === tipo);
  return match?.value ?? "refrigerado";
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
  const [picker, setPicker] = useState<PickerKind>(null);
  const [segmentoFilter, setSegmentoFilter] = useState("");

  useEffect(() => {
    if (!open || !camion) return;

    const resolvedTipo = resolveCamionTipo(String(camion.tipo));
    const tipoCatalog = getCamionTipoCatalogItem(resolvedTipo);
    const parsedRango = parseRangoTemperatura(camion.rangoTemperatura);
    const matched = matchCamionCatalogByNombre(camion.marca, camion.modelo);

    setPlaca(camion.placa);
    setMarcaId(matched.marcaId);
    setMarca(camion.marca ?? "");
    setModeloId(matched.modeloId);
    setModelo(camion.modelo ?? "");
    setCapacidadKg(
      camion.capacidadKg != null ? String(camion.capacidadKg) : "",
    );
    setCapacidadM3(
      camion.capacidadM3 != null ? String(camion.capacidadM3) : "",
    );
    setCapacidadPallets(
      camion.capacidadPallets != null ? String(camion.capacidadPallets) : "",
    );
    setTipo(resolvedTipo);
    setTempMin(parsedRango?.tempMin ?? tipoCatalog?.tempMinDefault ?? -25);
    setTempMax(parsedRango?.tempMax ?? tipoCatalog?.tempMaxDefault ?? 15);
    setDisponible(camion.disponible);
    setError(null);
    setIsSubmitting(false);
    setPicker(null);
    setSegmentoFilter("");
  }, [camion, open]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const marcasFiltradas = useMemo(() => {
    if (!segmentoFilter) return CAMION_MARCAS_CATALOG;
    return CAMION_MARCAS_CATALOG.filter(
      (item) => item.segmento === segmentoFilter,
    );
  }, [segmentoFilter]);

  const modelosDeMarca = useMemo(() => {
    if (!marcaId) return [];
    return listModelosByMarcaId(marcaId);
  }, [marcaId]);

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

  const segmentoOptions = (
    Object.entries(CAMION_SEGMENTO_LABEL) as [CamionSegmentoCatalog, string][]
  ).map(([value, label]) => ({ value, label }));

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
        selectedKey={marcaId || null}
        searchPlaceholder="Buscar marca u origen"
        filterLabel="Segmento"
        filterOptions={segmentoOptions}
        filterValue={segmentoFilter}
        onFilterChange={setSegmentoFilter}
        onSelect={(nextMarca) => {
          setMarcaId(nextMarca.id);
          setMarca(nextMarca.nombre);
          setModeloId("");
          setModelo("");
        }}
      />

      <CamionCatalogTablePickerModal
        open={picker === "modelo"}
        onClose={() => setPicker(null)}
        title={`Modelos · ${marca || "marca"}`}
        description={`Modelos de ${getCamionMarcaById(marcaId)?.nombre ?? "la marca"}. Actualizá en camion-vehiculos.catalog.ts.`}
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
        selectedKey={modeloId || null}
        searchPlaceholder="Buscar modelo"
        emptyMessage="No hay modelos para esta marca en el catálogo."
        onSelect={(nextModelo) => {
          setModeloId(nextModelo.id);
          setModelo(nextModelo.nombre);
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
        selectedKey={tipo}
        searchPlaceholder="Buscar tipo o rango"
        onSelect={(nextTipo) => {
          setTipo(nextTipo.value);
          setTempMin(nextTipo.tempMinDefault);
          setTempMax(nextTipo.tempMaxDefault);
        }}
      />
    </>
  );
}
