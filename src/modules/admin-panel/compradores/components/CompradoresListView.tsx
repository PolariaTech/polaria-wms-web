"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/table/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  COMPRADORES_EMPTY_MESSAGE,
  COMPRADORES_PAGE_HINT,
  COMPRADORES_PAGE_TITLE,
  COMPRADORES_TABLE_SUBTITLE,
  COMPRADORES_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  listCompradoresAdmin,
  type CompradorListRow,
} from "../services/compradores.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { CompradorAliasCreateModal } from "./CompradorAliasCreateModal";
import { CompradorCreateModal } from "./CompradorCreateModal";
import { CompradorDetalleModal } from "./CompradorDetalleModal";
import { CompradorEditModal } from "./CompradorEditModal";

export function CompradoresListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAliasOpen, setIsAliasOpen] = useState(false);
  const [editingComprador, setEditingComprador] =
    useState<CompradorListRow | null>(null);
  const [detalleComprador, setDetalleComprador] =
    useState<CompradorListRow | null>(null);

  const fetchCompradores = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listCompradoresAdmin({ codigoCuenta });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchCompradores,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "codigo",
          header: "Código",
          cell: (row: CompradorListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "comprador",
          header: "Comprador",
          cell: (row: CompradorListRow) => row.comprador,
        },
        {
          id: "telefono",
          header: "Teléfono",
          cell: (row: CompradorListRow) =>
            formatInternationalPhoneDisplay(row.telefono),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: CompradorListRow) => (
            <span
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <PolariaTableEditButton
                onClick={() => setEditingComprador(row)}
              />
            </span>
          ),
        },
      ] as const,
    [],
  );

  return (
    <AdminCatalogListShell
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={COMPRADORES_PAGE_TITLE}
      hint={COMPRADORES_PAGE_HINT}
    >
      <PolariaDataTable
        title={COMPRADORES_TABLE_TITLE}
        subtitle={COMPRADORES_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idComprador}
        emptyMessage={COMPRADORES_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        additionalActions={[
          {
            label: "Crear Alias",
            variant: "outline",
            onClick: () => setIsAliasOpen(true),
          },
        ]}
        primaryAction={{
          label: "Nuevo comprador",
          onClick: () => setIsCreateOpen(true),
        }}
        onRowClick={(row) => setDetalleComprador(row)}
        getRowAriaLabel={(row) => `Ver detalle de ${row.comprador}`}
      />

      <CompradorCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />

      <CompradorAliasCreateModal
        open={isAliasOpen}
        onClose={() => setIsAliasOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />

      <CompradorDetalleModal
        open={Boolean(detalleComprador)}
        comprador={detalleComprador}
        onClose={() => setDetalleComprador(null)}
      />

      <CompradorEditModal
        open={Boolean(editingComprador)}
        comprador={editingComprador}
        onClose={() => setEditingComprador(null)}
        onUpdated={() => {
          void reload();
        }}
      />
    </AdminCatalogListShell>
  );
}
