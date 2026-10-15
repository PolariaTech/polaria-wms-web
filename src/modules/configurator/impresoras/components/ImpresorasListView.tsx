"use client";

import { useCallback, useMemo, useState } from "react";
import { PolariaConfirmDialog } from "@/components/shared/form/PolariaConfirmDialog";
import {
  PolariaDataTable,
  type PolariaDataTableColumn,
} from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableDeleteButton,
  PolariaTableEditButton,
} from "@/components/shared/table/PolariaTableCells";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  IMPRESORAS_EMPTY_MESSAGE,
  IMPRESORAS_TABLE_SUBTITLE,
  IMPRESORAS_TABLE_TITLE,
} from "@/modules/configurator/shared/constants/configurator-list";
import { ConfiguratorListShell } from "@/modules/configurator/shared/components/ConfiguratorListShell";
import {
  deleteImpresoraConfigurator,
  labelModoEnvio,
  listImpresorasConfigurator,
  type ImpresoraListRow,
} from "@/modules/configurator/impresoras/services/impresoras.service";
import { ImpresoraCreateModal } from "./ImpresoraCreateModal";

interface ImpresorasListViewProps {
  /** Si viene, lista y alta quedan acotadas a esa cuenta (cockpit). */
  codigoCuenta?: string;
}

export function ImpresorasListView({ codigoCuenta }: ImpresorasListViewProps) {
  const lockedCuenta = codigoCuenta?.trim() || undefined;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ImpresoraListRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ImpresoraListRow | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fetchImpresoras = useCallback(() => listImpresorasConfigurator(), []);
  const { data, isLoading, isRefreshing, error, reload } =
    useAsyncQuery(fetchImpresoras);

  const rows = useMemo(() => {
    const all = data ?? [];
    if (!lockedCuenta) return all;
    return all.filter((row) => row.codigoCuenta === lockedCuenta);
  }, [data, lockedCuenta]);

  const cuentaYaTieneActiva = useMemo(
    () => rows.some((row) => row.estaActiva),
    [rows],
  );

  const columns = useMemo((): PolariaDataTableColumn<ImpresoraListRow>[] => {
    const cols: PolariaDataTableColumn<ImpresoraListRow>[] = [
      {
        id: "nombre",
        header: "Nombre",
        cell: (row) => row.nombre,
      },
    ];

    if (!lockedCuenta) {
      cols.push({
        id: "cuenta",
        header: "Cuenta",
        cell: (row) => row.cuentaNombre,
      });
    }

    cols.push(
      {
        id: "camino",
        header: "Camino",
        cell: (row) => labelModoEnvio(row.modoEnvio),
      },
      {
        id: "destino",
        header: "Destino",
        cell: (row) => {
          if (row.emailDestino?.trim()) return row.emailDestino.trim();
          if (row.nombreSistema?.trim()) return row.nombreSistema.trim();
          if (row.hostIp) {
            return row.puerto ? `${row.hostIp}:${row.puerto}` : row.hostIp;
          }
          return "—";
        },
      },
      {
        id: "estado",
        header: "Estado",
        cell: (row) =>
          row.estaActiva ? (
            <PolariaTableBadge>Activa</PolariaTableBadge>
          ) : (
            <PolariaTableBadge variant="neutral">Inactiva</PolariaTableBadge>
          ),
      },
      {
        id: "acciones",
        header: "Acciones",
        cell: (row) => (
          <div
            className="flex flex-wrap items-center gap-2"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <PolariaTableEditButton onClick={() => setEditing(row)} />
            <PolariaTableDeleteButton
              onClick={() => {
                setDeleteError(null);
                setPendingDelete(row);
              }}
            />
          </div>
        ),
      },
    );

    return cols;
  }, [lockedCuenta]);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteImpresoraConfigurator(pendingDelete.idImpresora);
      setPendingDelete(null);
      void reload();
    } catch (err) {
      setDeleteError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo eliminar la impresora.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const canAdd =
    !lockedCuenta || !cuentaYaTieneActiva || rows.length === 0;

  return (
    <ConfiguratorListShell>
      <PolariaDataTable
        title={IMPRESORAS_TABLE_TITLE}
        subtitle={
          lockedCuenta
            ? cuentaYaTieneActiva
              ? "Esta cuenta ya tiene impresora. Al imprimir se usa sola. Para cambiar, elimínala y configura otra."
              : "Configura una impresora para esta cuenta. Aplicará a todos sus usuarios; al imprimir se usa sola."
            : IMPRESORAS_TABLE_SUBTITLE
        }
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
        primaryAction={
          canAdd
            ? {
                label:
                  rows.length === 0 ? "Configurar impresora" : "Agregar",
                onClick: () => {
                  setEditing(null);
                  setIsCreateOpen(true);
                },
              }
            : undefined
        }
      />

      <ImpresoraCreateModal
        open={isCreateOpen || Boolean(editing)}
        impresora={editing}
        lockedCodigoCuenta={lockedCuenta}
        onClose={() => {
          setIsCreateOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          void reload();
        }}
      />

      <PolariaConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => {
          if (isDeleting) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title="Eliminar impresora"
        description={
          pendingDelete
            ? `Se eliminará «${pendingDelete.nombre}» de la cuenta. Después podrás configurar otra.`
            : undefined
        }
        confirmLabel="Eliminar"
        isSubmitting={isDeleting}
        error={deleteError}
      />
    </ConfiguratorListShell>
  );
}
