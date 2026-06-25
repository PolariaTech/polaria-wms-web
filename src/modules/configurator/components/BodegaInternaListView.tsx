"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/PolariaDataTable";
import { PolariaTableEditButton } from "@/components/shared/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
import {
  BODEGA_INTERNA_EMPTY_MESSAGE,
  BODEGA_INTERNA_TABLE_SUBTITLE,
  BODEGA_INTERNA_TABLE_TITLE,
} from "../constants/configurator-list";
import { listBodegasInternasConfigurator } from "../services/bodegas-internas.service";
import type { BodegaInternaListRow } from "../services/bodegas-internas.service";
import { BodegaInternaCreateModal } from "./BodegaInternaCreateModal";
import { ConfiguratorListShell } from "./ConfiguratorListShell";

function formatCapacidad(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("es-CL");
}

export function BodegaInternaListView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const fetchBodegas = useCallback(() => listBodegasInternasConfigurator(), []);
  const { data, isLoading, isRefreshing, error, reload } =
    useAsyncQuery(fetchBodegas);

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: BodegaInternaListRow) => row.nombre,
        },
        {
          id: "capacidad",
          header: "Capacidad",
          cell: (row: BodegaInternaListRow) => formatCapacidad(row.capacidad),
        },
        {
          id: "bodega-asignada",
          header: "Bodega asignada",
          cell: (row: BodegaInternaListRow) => row.bodegaAsignada,
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
        title={BODEGA_INTERNA_TABLE_TITLE}
        subtitle={BODEGA_INTERNA_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={error}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idBodega}
        emptyMessage={BODEGA_INTERNA_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Agregar",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <BodegaInternaCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </ConfiguratorListShell>
  );
}
