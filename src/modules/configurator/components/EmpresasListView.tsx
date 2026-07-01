"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/phone-countries";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
import {
  EMPRESAS_EMPTY_MESSAGE,
  EMPRESAS_TABLE_SUBTITLE,
  EMPRESAS_TABLE_TITLE,
} from "../constants/configurator-list";
import { listEmpresasConfigurator } from "../services/empresas.service";
import type { EmpresaListRow } from "../services/empresas.service";
import { ConfiguratorListShell } from "./ConfiguratorListShell";
import { EmpresaCreateModal } from "./EmpresaCreateModal";

export function EmpresasListView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const fetchEmpresas = useCallback(() => listEmpresasConfigurator(), []);
  const { data, isLoading, isRefreshing, error, reload } =
    useAsyncQuery(fetchEmpresas);

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "codigo",
          header: "Código",
          cell: (row: EmpresaListRow) => (
            <PolariaTableCode>{row.codigoEmpresa}</PolariaTableCode>
          ),
        },
        {
          id: "razonSocial",
          header: "Razón social",
          cell: (row: EmpresaListRow) => row.razonSocial,
        },
        {
          id: "telefono",
          header: "Teléfono",
          cell: (row: EmpresaListRow) =>
            formatInternationalPhoneDisplay(row.telefono),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: EmpresaListRow) =>
            row.estaActiva ? (
              <PolariaTableBadge>Activa</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">Inactiva</PolariaTableBadge>
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
        title={EMPRESAS_TABLE_TITLE}
        subtitle={EMPRESAS_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={error}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.codigoEmpresa}
        emptyMessage={EMPRESAS_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Agregar",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <EmpresaCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </ConfiguratorListShell>
  );
}
