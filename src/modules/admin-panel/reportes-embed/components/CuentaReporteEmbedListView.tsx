"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableActionGroup,
  PolariaTableBadge,
  PolariaTableEditButton,
} from "@/components/shared/table/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  REPORTES_URL_EMPTY_MESSAGE,
  REPORTES_URL_PAGE_HINT,
  REPORTES_URL_PAGE_TITLE,
  REPORTES_URL_TABLE_SUBTITLE,
  REPORTES_URL_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import {
  listCuentaReportesEmbedAdmin,
  type CuentaReporteEmbedAdminRow,
} from "../services/cuenta-reporte-embed-gestion.client";
import { CuentaReporteEmbedCreateModal } from "./CuentaReporteEmbedCreateModal";
import { CuentaReporteEmbedEditModal } from "./CuentaReporteEmbedEditModal";

export function CuentaReporteEmbedListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CuentaReporteEmbedAdminRow | null>(
    null,
  );

  const fetchRows = useCallback(() => {
    if (!codigoCuenta) return Promise.resolve([]);
    return listCuentaReportesEmbedAdmin();
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchRows,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "descripcion",
          header: "Descripción",
          cell: (row: CuentaReporteEmbedAdminRow) =>
            row.descripcion?.trim() || "—",
        },
        {
          id: "url",
          header: "URL",
          cell: (row: CuentaReporteEmbedAdminRow) => (
            <span className="block max-w-[28rem] truncate" title={row.embedUrl}>
              {row.embedUrl}
            </span>
          ),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: CuentaReporteEmbedAdminRow) =>
            row.estaActivo ? (
              <PolariaTableBadge>Activo</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">Inactivo</PolariaTableBadge>
            ),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: CuentaReporteEmbedAdminRow) => (
            <span
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <PolariaTableActionGroup>
                <PolariaTableEditButton onClick={() => setEditing(row)} />
              </PolariaTableActionGroup>
            </span>
          ),
        },
      ] as const,
    [],
  );

  return (
    <AdminCatalogListShell
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={REPORTES_URL_PAGE_TITLE}
      hint={REPORTES_URL_PAGE_HINT}
    >
      <PolariaDataTable
        title={REPORTES_URL_TABLE_TITLE}
        subtitle={REPORTES_URL_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyMessage={REPORTES_URL_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Cargar reporte",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <CuentaReporteEmbedCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />

      <CuentaReporteEmbedEditModal
        open={Boolean(editing)}
        reporte={editing}
        onClose={() => setEditing(null)}
        onUpdated={() => {
          void reload();
        }}
      />
    </AdminCatalogListShell>
  );
}
