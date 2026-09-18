"use client";

import { useCallback, useMemo, useState } from "react";
import {
  PolariaDataTable,
  type PolariaDataTableColumn,
} from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/table/PolariaTableCells";
import { formatInternationalPhoneDisplay } from "@/constants/ui/phone-countries";
import { accesoProductoFromFlags, accesoProductoLabel } from "@/lib/auth/cuenta-producto-access";
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
import { UsuarioEditModal } from "./UsuarioEditModal";

interface UsuariosListViewProps {
  codigoCuenta?: string;
}

export function UsuariosListView({ codigoCuenta }: UsuariosListViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioListRow | null>(
    null,
  );
  const fetchUsuarios = useCallback(() => listUsuariosConfigurator(), []);
  const { data, isLoading, isRefreshing, error, reload } =
    useAsyncQuery(fetchUsuarios);

  const rows = useMemo(() => {
    const all = data ?? [];
    if (!codigoCuenta) return all;
    return all.filter((row) => row.codigoCuenta === codigoCuenta);
  }, [codigoCuenta, data]);

  const columns = useMemo((): PolariaDataTableColumn<UsuarioListRow>[] => {
    const all: PolariaDataTableColumn<UsuarioListRow>[] = [
      {
        id: "codigo",
        header: "Código",
        cell: (row) => <PolariaTableCode>{row.codigo}</PolariaTableCode>,
      },
      {
        id: "rol",
        header: "Rol",
        cell: (row) => row.rol,
      },
      {
        id: "nombre",
        header: "Nombre",
        cell: (row) => row.nombre,
      },
      {
        id: "cuenta",
        header: "Cuenta",
        cell: (row) => row.cuenta,
      },
      {
        id: "telefono",
        header: "Teléfono",
        cell: (row) =>
          formatInternationalPhoneDisplay(
            row.telefono === "—" ? null : row.telefono,
          ),
      },
      {
        id: "credenciales",
        header: "Credenciales",
        cell: (row) =>
          row.tieneCredenciales ? (
            <PolariaTableBadge>Sí</PolariaTableBadge>
          ) : (
            <PolariaTableBadge variant="neutral">No</PolariaTableBadge>
          ),
      },
      {
        id: "producto",
        header: "Producto",
        cell: (row) => (
          <PolariaTableBadge>
            {accesoProductoLabel(
              accesoProductoFromFlags(row.accesoWms, row.accesoMateo),
            )}
          </PolariaTableBadge>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: (row) => (
          <PolariaTableEditButton onClick={() => setEditingUsuario(row)} />
        ),
      },
    ];

    return codigoCuenta
      ? all.filter((column) => column.id !== "cuenta")
      : all;
  }, [codigoCuenta]);

  return (
    <ConfiguratorListShell>
      <PolariaDataTable
        title={USUARIOS_TABLE_TITLE}
        subtitle={
          codigoCuenta
            ? `Usuarios de la cuenta ${codigoCuenta}.`
            : USUARIOS_TABLE_SUBTITLE
        }
        isLoading={isLoading}
        error={error}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idUsuario}
        emptyMessage={
          codigoCuenta
            ? "No hay usuarios en esta cuenta."
            : USUARIOS_EMPTY_MESSAGE
        }
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
        lockedCodigoCuenta={codigoCuenta}
      />

      <UsuarioEditModal
        open={Boolean(editingUsuario)}
        usuario={editingUsuario}
        onClose={() => setEditingUsuario(null)}
        onUpdated={() => {
          void reload();
        }}
      />
    </ConfiguratorListShell>
  );
}
