"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import { PolariaTableEditButton } from "@/components/shared/table/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import {
  BODEGA_EXTERNA_EMPTY_MESSAGE,
  BODEGA_EXTERNA_TABLE_SUBTITLE,
  BODEGA_EXTERNA_TABLE_TITLE,
} from "@/modules/configurator/shared/constants/configurator-list";
import { listBodegasExternasConfigurator } from "../services/bodegas-externas.service";
import type { BodegaExternaListRow } from "../services/bodegas-externas.service";
import { BodegaExternaCreateModal } from "./BodegaExternaCreateModal";
import { ConfiguratorListShell } from "@/modules/configurator/shared/components/ConfiguratorListShell";

function formatCapacidad(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("es-CL");
}

export function BodegaExternaListView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const fetchBodegas = useCallback(() => listBodegasExternasConfigurator(), []);
  const { data, isLoading, isRefreshing, error, reload } =
    useAsyncQuery(fetchBodegas);

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: BodegaExternaListRow) => row.nombre,
        },
        {
          id: "capacidad",
          header: "Capacidad",
          cell: (row: BodegaExternaListRow) => formatCapacidad(row.capacidad),
        },
        {
          id: "bodega-asignada",
          header: "Bodega asignada",
          cell: (row: BodegaExternaListRow) => row.bodegaAsignada,
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
    <ConfiguratorListShell>
      <PolariaDataTable
        title={BODEGA_EXTERNA_TABLE_TITLE}
        subtitle={BODEGA_EXTERNA_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={error}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idBodega}
        emptyMessage={BODEGA_EXTERNA_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Agregar",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <BodegaExternaCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </ConfiguratorListShell>
  );
}
