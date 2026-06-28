"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/PolariaDataTable";
import {
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
import { useCompany } from "@/providers/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  PLANTAS_EMPTY_MESSAGE,
  PLANTAS_PAGE_HINT,
  PLANTAS_PAGE_TITLE,
  PLANTAS_TABLE_SUBTITLE,
  PLANTAS_TABLE_TITLE,
} from "../constants/admin-catalog-list";
import {
  formatPlantaId,
  listPlantasAdmin,
  type PlantaListRow,
} from "../services/plantas.service";
import { AdminCatalogListShell } from "./AdminCatalogListShell";
import { PlantaCreateModal } from "./PlantaCreateModal";

export function PlantasListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchPlantas = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listPlantasAdmin({ codigoCuenta });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchPlantas,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "id",
          header: "ID",
          cell: (row: PlantaListRow) => (
            <span className="font-mono text-polaria-w-50">
              {formatPlantaId(row.idPlanta)}
            </span>
          ),
        },
        {
          id: "codigo",
          header: "Código",
          cell: (row: PlantaListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: PlantaListRow) => row.nombre,
        },
        {
          id: "direccion",
          header: "Dirección",
          cell: (row: PlantaListRow) => row.direccion,
        },
        {
          id: "pallets",
          header: "Cap. Pallets",
          cell: (row: PlantaListRow) => row.capacidadPallets ?? "—",
        },
        {
          id: "rango-temp",
          header: "Rango Temp",
          cell: (row: PlantaListRow) => row.rangoTemperatura ?? "—",
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: () => <PolariaTableEditButton />,
        },
      ] as const,
    [],
  );

  return (
    <AdminCatalogListShell
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={PLANTAS_PAGE_TITLE}
      hint={PLANTAS_PAGE_HINT}
    >
      <PolariaDataTable
        title={PLANTAS_TABLE_TITLE}
        subtitle={PLANTAS_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idPlanta}
        emptyMessage={PLANTAS_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Nueva planta",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <PlantaCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </AdminCatalogListShell>
  );
}
