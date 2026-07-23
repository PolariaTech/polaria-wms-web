"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import { PolariaTableCode } from "@/components/shared/table/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  ADMIN_CATALOG_SECTION_LABEL,
  USUARIOS_EMPTY_MESSAGE,
  USUARIOS_PAGE_HINT,
  USUARIOS_PAGE_TITLE,
  USUARIOS_TABLE_SUBTITLE,
  USUARIOS_TABLE_TITLE,
} from "@/modules/admin-panel/shared/constants/admin-catalog-list";
import {
  formatUsuarioAdminCreatedAt,
  listUsuariosAdmin,
  type UsuarioAdminListRow,
} from "../services/usuarios-admin.service";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
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
          id: "telefono",
          header: "Teléfono",
          cell: (row: UsuarioAdminListRow) =>
            formatInternationalPhoneDisplay(
              row.telefono === "—" ? null : row.telefono,
            ),
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
