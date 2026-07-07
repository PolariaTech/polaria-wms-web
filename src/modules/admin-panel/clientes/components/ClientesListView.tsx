"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import { PolariaTableCode } from "@/components/shared/table/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  CLIENTES_EMPTY_MESSAGE,
  CLIENTES_PAGE_HINT,
  CLIENTES_PAGE_TITLE,
  CLIENTES_TABLE_SUBTITLE,
  CLIENTES_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  formatClienteId,
  listClientesAdmin,
  type ClienteListRow,
} from "../services/clientes.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { ClienteCreateModal } from "./ClienteCreateModal";

export function ClientesListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchClientes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listClientesAdmin({ codigoCuenta });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchClientes,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "id",
          header: "ID",
          cell: (row: ClienteListRow) => (
            <span className="font-mono text-polaria-w-50">
              {formatClienteId(row.idCliente)}
            </span>
          ),
        },
        {
          id: "codigo",
          header: "Código",
          cell: (row: ClienteListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: ClienteListRow) => row.nombre,
        },
        {
          id: "nit",
          header: "NIT",
          cell: (row: ClienteListRow) => row.nit,
        },
        {
          id: "telefono",
          header: "Teléfono",
          cell: (row: ClienteListRow) =>
            formatInternationalPhoneDisplay(row.telefono),
        },
      ] as const,
    [],
  );

  return (
    <AdminCatalogListShell
      sectionLabel={ADMIN_CATALOG_SECTION_LABEL}
      title={CLIENTES_PAGE_TITLE}
      hint={CLIENTES_PAGE_HINT}
    >
      <PolariaDataTable
        title={CLIENTES_TABLE_TITLE}
        subtitle={CLIENTES_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idCliente}
        emptyMessage={CLIENTES_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Nuevo cliente",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <ClienteCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </AdminCatalogListShell>
  );
}
