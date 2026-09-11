"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableEditButton,
} from "@/components/shared/table/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import {
  IMPRESORAS_EMPTY_MESSAGE,
  IMPRESORAS_TABLE_SUBTITLE,
  IMPRESORAS_TABLE_TITLE,
} from "@/modules/configurator/shared/constants/configurator-list";
import { ConfiguratorListShell } from "@/modules/configurator/shared/components/ConfiguratorListShell";
import {
  labelModoEnvio,
  labelPais,
  labelTipoConexion,
  listImpresorasConfigurator,
  type ImpresoraListRow,
} from "@/modules/configurator/impresoras/services/impresoras.service";
import { ImpresoraCreateModal } from "./ImpresoraCreateModal";

export function ImpresorasListView() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ImpresoraListRow | null>(null);
  const fetchImpresoras = useCallback(() => listImpresorasConfigurator(), []);
  const { data, isLoading, isRefreshing, error, reload } =
    useAsyncQuery(fetchImpresoras);

  const rows = data ?? [];

  const columns = useMemo(
    () =>
      [
        {
          id: "nombre",
          header: "Nombre",
          cell: (row: ImpresoraListRow) => row.nombre,
        },
        {
          id: "codigo",
          header: "Código",
          cell: (row: ImpresoraListRow) =>
            row.codigo ? (
              <PolariaTableCode>{row.codigo}</PolariaTableCode>
            ) : (
              "—"
            ),
        },
        {
          id: "cuenta",
          header: "Cuenta",
          cell: (row: ImpresoraListRow) => row.cuentaNombre,
        },
        {
          id: "marca",
          header: "Marca",
          cell: (row: ImpresoraListRow) =>
            row.marca
              ? row.modelo
                ? `${row.marca} ${row.modelo}`
                : row.marca
              : "—",
        },
        {
          id: "pais",
          header: "País",
          cell: (row: ImpresoraListRow) => labelPais(row.pais),
        },
        {
          id: "conexion",
          header: "Conexión",
          cell: (row: ImpresoraListRow) =>
            `${labelTipoConexion(row.tipoConexion)} · ${labelModoEnvio(row.modoEnvio)}`,
        },
        {
          id: "destino",
          header: "Destino",
          cell: (row: ImpresoraListRow) => {
            if (row.hostIp) {
              return row.puerto
                ? `${row.hostIp}:${row.puerto}`
                : row.hostIp;
            }
            return row.ubicacionTexto?.trim() || "—";
          },
        },
        {
          id: "papel",
          header: "Papel",
          cell: (row: ImpresoraListRow) => row.tamanoPapel.toUpperCase(),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: ImpresoraListRow) =>
            row.estaActiva ? (
              <PolariaTableBadge>Activa</PolariaTableBadge>
            ) : (
              <PolariaTableBadge variant="neutral">Inactiva</PolariaTableBadge>
            ),
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: ImpresoraListRow) => (
            <div
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <PolariaTableEditButton onClick={() => setEditing(row)} />
            </div>
          ),
        },
      ] as const,
    [],
  );

  return (
    <ConfiguratorListShell>
      <PolariaDataTable
        title={IMPRESORAS_TABLE_TITLE}
        subtitle={IMPRESORAS_TABLE_SUBTITLE}
        isLoading={isLoading}
        error={error}
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idImpresora}
        emptyMessage={IMPRESORAS_EMPTY_MESSAGE}
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: rows.length === 0 ? "Configurar impresora" : "Agregar",
          onClick: () => {
            setEditing(null);
            setIsCreateOpen(true);
          },
        }}
      />

      <ImpresoraCreateModal
        open={isCreateOpen || Boolean(editing)}
        impresora={editing}
        onClose={() => {
          setIsCreateOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          void reload();
        }}
      />
    </ConfiguratorListShell>
  );
}
