"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/PolariaDataTable";
import {
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
import { useCompany } from "@/providers/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  USUARIOS_EMPTY_MESSAGE,
  USUARIOS_PAGE_HINT,
  USUARIOS_PAGE_TITLE,
  USUARIOS_TABLE_SUBTITLE,
  USUARIOS_TABLE_TITLE,
} from "../constants/admin-catalog-list";
import {
  formatUsuarioAdminCreatedAt,
  listUsuariosAdmin,
  type UsuarioAdminListRow,
} from "../services/usuarios-admin.service";
import { AdminCatalogListShell } from "./AdminCatalogListShell";
import { UsuarioAdminCreateModal } from "./UsuarioAdminCreateModal";

export function UsuariosAdminListView() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchUsuarios = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listUsuariosAdmin({ codigoCuenta });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchUsuarios,
    Boolean(codigoCuenta),
  );

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: UsuarioAdminListRow) => row.nombre,
        },
        {
          id: "correo",
          header: "Correo",
          cell: (row: UsuarioAdminListRow) => row.correo,
        },
        {
          id: "codigo",
          header: "Código",
          cell: (row: UsuarioAdminListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "alta",
          header: "Alta",
          cell: (row: UsuarioAdminListRow) =>
            formatUsuarioAdminCreatedAt(row.createdAt),
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
      title={USUARIOS_PAGE_TITLE}
      hint={USUARIOS_PAGE_HINT}
    >
      <PolariaDataTable
        title={USUARIOS_TABLE_TITLE}
        subtitle={USUARIOS_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idUsuario}
        emptyMessage={USUARIOS_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Asignar usuario",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <UsuarioAdminCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </AdminCatalogListShell>
  );
}
