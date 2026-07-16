"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/table/PolariaTableCells";
import { cn } from "@/lib/utils/cn";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import {
  CUENTAS_EMPTY_MESSAGE,
  CUENTAS_TABLE_SUBTITLE,
  CUENTAS_TABLE_TITLE,
} from "@/modules/configurator/shared/constants/configurator-list";
import { listCuentasConfigurator } from "../services/cuentas.service";
import type { CuentaListRow } from "../services/cuentas.service";
import { ConfiguratorListShell } from "@/modules/configurator/shared/components/ConfiguratorListShell";
import { CuentaBodegasAsignadasModal } from "./CuentaBodegasAsignadasModal";
import { CuentaCreateModal } from "./CuentaCreateModal";
import { CuentaEditModal } from "./CuentaEditModal";

export function CuentasListView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<CuentaListRow | null>(
    null,
  );
  const [bodegasModalCuenta, setBodegasModalCuenta] =
    useState<CuentaListRow | null>(null);
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
          cell: (row: CuentaListRow) => {
            const principal = row.bodegaInternaPrincipal;
            if (!principal) {
              return <span className="text-polaria-w-50">—</span>;
            }

            const resto = Math.max(0, row.bodegasAsignadas.length - 1);

            return (
              <div className="flex items-center gap-1.5">
                <PolariaTableBadge>{principal.nombre}</PolariaTableBadge>
                {resto > 0 ? (
                  <button
                    type="button"
                    onClick={() => setBodegasModalCuenta(row)}
                    aria-label={`Ver ${resto} bodegas más de ${row.nombreComercial}`}
                    className={cn(
                      "inline-flex rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-2.5 py-1",
                      "polaria-text-badge font-semibold text-polaria-teal transition hover:bg-polaria-t-20",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                    )}
                  >
                    +{resto}
                  </button>
                ) : null}
              </div>
            );
          },
        },
        {
          id: "credenciales",
          header: "Credenciales",
          cell: (row: CuentaListRow) =>
            row.estaActiva ? (
              <PolariaTableBadge>Sí</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">No</PolariaTableBadge>
            ),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: CuentaListRow) => (
            <PolariaTableEditButton onClick={() => setEditingCuenta(row)} />
          ),
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

      <CuentaEditModal
        open={Boolean(editingCuenta)}
        cuenta={editingCuenta}
        onClose={() => setEditingCuenta(null)}
        onUpdated={() => {
          void reload();
        }}
      />

      <CuentaBodegasAsignadasModal
        open={Boolean(bodegasModalCuenta)}
        onClose={() => setBodegasModalCuenta(null)}
        cuentaNombre={bodegasModalCuenta?.nombreComercial ?? ""}
        bodegas={bodegasModalCuenta?.bodegasAsignadas ?? []}
      />
    </ConfiguratorListShell>
  );
}
