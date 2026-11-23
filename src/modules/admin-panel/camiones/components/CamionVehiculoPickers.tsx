"use client";

import { useMemo } from "react";
import {
  CAMION_TIPO_CATALOG,
  type CamionTipoCatalogItem,
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
import type { CamionPickerKind } from "./camion-modal.helpers";
import { CamionCatalogTablePickerModal } from "./CamionCatalogTablePickerModal";

interface CamionVehiculoPickersProps {
  picker: CamionPickerKind;
  onClose: () => void;
  segmentoFilter: string;
  onSegmentoFilterChange: (value: string) => void;
  marcaId: string;
  marca: string;
  modeloId: string;
  tipo: string;
  onSelectMarca: (marca: CamionMarcaCatalogItem) => void;
  onSelectModelo: (modelo: CamionModeloCatalogItem) => void;
  onSelectTipo: (tipo: CamionTipoCatalogItem) => void;
}

/** Pickers de marca, modelo y tipo compartidos por alta y edición de camión. */
export function CamionVehiculoPickers({
  picker,
  onClose,
  segmentoFilter,
  onSegmentoFilterChange,
  marcaId,
  marca,
  modeloId,
  tipo,
  onSelectMarca,
  onSelectModelo,
  onSelectTipo,
}: CamionVehiculoPickersProps) {
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

  const segmentoOptions = (
    Object.entries(CAMION_SEGMENTO_LABEL) as [CamionSegmentoCatalog, string][]
  ).map(([value, label]) => ({ value, label }));

  return (
    <>
      <CamionCatalogTablePickerModal
        open={picker === "marca"}
        onClose={onClose}
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
        onFilterChange={onSegmentoFilterChange}
        onSelect={onSelectMarca}
      />

      <CamionCatalogTablePickerModal
        open={picker === "modelo"}
        onClose={onClose}
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
        onSelect={onSelectModelo}
      />

      <CamionCatalogTablePickerModal
        open={picker === "tipo"}
        onClose={onClose}
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
        onSelect={onSelectTipo}
      />
    </>
  );
}
