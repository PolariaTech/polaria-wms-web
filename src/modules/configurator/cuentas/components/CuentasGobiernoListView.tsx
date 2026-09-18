"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { getCuentaGobiernoHref } from "@/modules/configurator/cuentas/constants/cuenta-cockpit";
import {
  listCuentasGobiernoConfigurator,
  type CuentaGobiernoListRow,
} from "@/modules/configurator/cuentas/services/cuentas.service";
import { ConfiguratorListShell } from "@/modules/configurator/shared/components/ConfiguratorListShell";
import {
  CUENTAS_EMPTY_MESSAGE,
  CUENTAS_GOBIERNO_TABLE_SUBTITLE,
  CUENTAS_GOBIERNO_TABLE_TITLE,
} from "@/modules/configurator/shared/constants/configurator-list";

export function CuentasGobiernoListView() {
  const router = useRouter();
  const fetchCuentas = useCallback(() => listCuentasGobiernoConfigurator(), []);
  const { data, isLoading, isRefreshing, error, reload } =
    useAsyncQuery(fetchCuentas);

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "codigo",
          header: "Código",
          cell: (row: CuentaGobiernoListRow) => (
            <PolariaTableCode>{row.codigoCuenta}</PolariaTableCode>
          ),
        },
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: CuentaGobiernoListRow) => row.nombreComercial,
        },
        {
          id: "empresa",
          header: "Empresa",
          cell: (row: CuentaGobiernoListRow) => row.empresaNombre,
        },
        {
          id: "acceso",
          header: "Acceso",
          cell: (row: CuentaGobiernoListRow) =>
            row.estaActiva ? (
              <PolariaTableBadge>Activo</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">Inactivo</PolariaTableBadge>
            ),
        },
        {
          id: "bodega",
          header: "Bodega",
          cell: (row: CuentaGobiernoListRow) =>
            row.bodegaInternaPrincipal ? (
              <PolariaTableBadge>
                {row.bodegaInternaPrincipal.nombre}
              </PolariaTableBadge>
            ) : (
              <span className="text-polaria-w-50">—</span>
            ),
        },
        {
          id: "credenciales",
          header: "Credenciales",
          cell: (row: CuentaGobiernoListRow) =>
            row.tieneCredenciales ? (
              <PolariaTableBadge>Sí</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">No</PolariaTableBadge>
            ),
        },
      ] as const,
    [],
  );

  return (
    <ConfiguratorListShell>
      <PolariaDataTable
        title={CUENTAS_GOBIERNO_TABLE_TITLE}
        subtitle={CUENTAS_GOBIERNO_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={error}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.codigoCuenta}
        emptyMessage={CUENTAS_EMPTY_MESSAGE}
        onRowClick={(row) => {
          router.push(getCuentaGobiernoHref(row.codigoCuenta));
        }}
        getRowAriaLabel={(row) => `Abrir control de ${row.nombreComercial}`}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
      />
    </ConfiguratorListShell>
  );
}
