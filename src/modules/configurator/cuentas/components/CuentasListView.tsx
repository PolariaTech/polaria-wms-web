"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/table/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import {
  CUENTAS_EMPTY_MESSAGE,
  CUENTAS_TABLE_SUBTITLE,
  CUENTAS_TABLE_TITLE,
} from "@/modules/configurator/shared/constants/configurator-list";
import { listCuentasConfigurator } from "../services/cuentas.service";
import type { CuentaListRow } from "../services/cuentas.service";
import { ConfiguratorListShell } from "@/modules/configurator/shared/components/ConfiguratorListShell";
import { CuentaCreateModal } from "./CuentaCreateModal";

export function CuentasListView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const fetchCuentas = useCallback(() => listCuentasConfigurator(), []);
  const { data, isLoading, isRefreshing, error, reload } =
    useAsyncQuery(fetchCuentas);

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "codigo",
          header: "Código",
          cell: (row: CuentaListRow) => (
            <PolariaTableCode>{row.codigoCuenta}</PolariaTableCode>
          ),
        },
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: CuentaListRow) => row.nombreComercial,
        },
        {
          id: "bodega",
          header: "Bodega asignada",
          cell: (row: CuentaListRow) => row.bodegaAsignada,
        },
        {
          id: "credenciales",
          header: "Credenciales",
          cell: (row: CuentaListRow) =>
            row.tieneCredenciales ? (
              <PolariaTableBadge>Sí</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">No</PolariaTableBadge>
            ),
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
        title={CUENTAS_TABLE_TITLE}
        subtitle={CUENTAS_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={error}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.codigoCuenta}
        emptyMessage={CUENTAS_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Agregar",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <CuentaCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </ConfiguratorListShell>
  );
}
