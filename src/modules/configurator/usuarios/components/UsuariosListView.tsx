"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/table/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import {
  USUARIOS_EMPTY_MESSAGE,
  USUARIOS_TABLE_SUBTITLE,
  USUARIOS_TABLE_TITLE,
} from "@/modules/configurator/shared/constants/configurator-list";
import { listUsuariosConfigurator } from "@/modules/configurator/usuarios/services/usuarios.service";
import type { UsuarioListRow } from "@/modules/configurator/usuarios/services/usuarios.service";
import { ConfiguratorListShell } from "@/modules/configurator/shared/components/ConfiguratorListShell";
import { UsuarioCreateModal } from "./UsuarioCreateModal";
export function UsuariosListView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const fetchUsuarios = useCallback(() => listUsuariosConfigurator(), []);
  const { data, isLoading, isRefreshing, error, reload } =
    useAsyncQuery(fetchUsuarios);

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "codigo",
          header: "Código",
          cell: (row: UsuarioListRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "rol",
          header: "Rol",
          cell: (row: UsuarioListRow) => row.rol,
        },
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: UsuarioListRow) => row.nombre,
        },
        {
          id: "cuenta",
          header: "Cuenta",
          cell: (row: UsuarioListRow) => row.cuenta,
        },
        {
          id: "telefono",
          header: "Teléfono",
          cell: (row: UsuarioListRow) =>
            formatInternationalPhoneDisplay(
              row.telefono === "—" ? null : row.telefono,
            ),
        },
        {
          id: "credenciales",
          header: "Credenciales",
          cell: (row: UsuarioListRow) =>
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
        title={USUARIOS_TABLE_TITLE}
        subtitle={USUARIOS_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={error}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idUsuario}
        emptyMessage={USUARIOS_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Agregar",
          onClick: () => setIsCreateOpen(true),
        }}
      />

      <UsuarioCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </ConfiguratorListShell>
  );
}
