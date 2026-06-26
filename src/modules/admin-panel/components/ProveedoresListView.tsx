"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/PolariaDataTable";
import {
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/phone-countries";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
import { useCompany } from "@/providers/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  PROVEEDORES_EMPTY_MESSAGE,
  PROVEEDORES_PAGE_HINT,
  PROVEEDORES_PAGE_TITLE,
  PROVEEDORES_TABLE_SUBTITLE,
  PROVEEDORES_TABLE_TITLE,
} from "../constants/admin-catalog-list";
import {
  formatProveedorId,
  listProveedoresAdmin,
  type ProveedorListRow,
} from "../services/proveedores.service";
import { AdminCatalogListShell } from "./AdminCatalogListShell";
import { ProveedorCreateModal } from "./ProveedorCreateModal";

export function ProveedoresListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchProveedores = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listProveedoresAdmin({ codigoCuenta });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchProveedores,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "id",
          header: "ID",
          cell: (row: ProveedorListRow) => (
            <span className="font-mono text-polaria-w-50">
              {formatProveedorId(row.idProveedor)}
            </span>
          ),
        },
        {
          id: "codigo",
          header: "Código",
          cell: (row: ProveedorListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "proveedor",
          header: "Proveedor",
          cell: (row: ProveedorListRow) => row.proveedor,
        },
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: ProveedorListRow) => row.nombre,
        },
        {
          id: "telefono",
          header: "Teléfono",
          cell: (row: ProveedorListRow) =>
            formatInternationalPhoneDisplay(row.telefono),
        },
        {
          id: "email",
          header: "Email",
          cell: (row: ProveedorListRow) => row.email ?? "—",
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
      title={PROVEEDORES_PAGE_TITLE}
      hint={PROVEEDORES_PAGE_HINT}
    >
      <PolariaDataTable
        title={PROVEEDORES_TABLE_TITLE}
        subtitle={PROVEEDORES_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idProveedor}
        emptyMessage={PROVEEDORES_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Nuevo proveedor",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <ProveedorCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </AdminCatalogListShell>
  );
}
