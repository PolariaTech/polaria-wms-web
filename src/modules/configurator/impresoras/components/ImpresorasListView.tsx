"use client";

import { Printer } from "lucide-react";
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
import { cn } from "@/lib/utils/cn";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import {
  getCuentaOvAutoImprimirConfigurator,
  updateCuentaOvAutoImprimirConfigurator,
} from "@/modules/configurator/cuentas/services/cuentas.service";
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

function AutoImprimirSwitchTrack({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition",
        on ? "bg-polaria-teal" : "bg-polaria-w-08",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition",
          on ? "translate-x-5 bg-polaria-bg" : "bg-polaria-w-50",
        )}
      />
    </span>
  );
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
  const [autoPrintError, setAutoPrintError] = useState<string | null>(null);
  const [isTogglingAutoPrint, setIsTogglingAutoPrint] = useState(false);

  const fetchImpresoras = useCallback(() => listImpresorasConfigurator(), []);
  const { data, isLoading, isRefreshing, error, reload } =
    useAsyncQuery(fetchImpresoras);

  const fetchAutoPrint = useCallback(async () => {
    if (!lockedCuenta) return null;
    return getCuentaOvAutoImprimirConfigurator(lockedCuenta);
  }, [lockedCuenta]);
  const {
    data: autoPrintConfig,
    isLoading: isAutoPrintLoading,
    reload: reloadAutoPrint,
  } = useAsyncQuery(fetchAutoPrint, Boolean(lockedCuenta));

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

  const handleToggleAutoPrint = async () => {
    if (!lockedCuenta || !autoPrintConfig || isTogglingAutoPrint) return;
    setIsTogglingAutoPrint(true);
    setAutoPrintError(null);
    try {
      await updateCuentaOvAutoImprimirConfigurator({
        codigoCuenta: lockedCuenta,
        codigoEmpresa: autoPrintConfig.codigoEmpresa,
        autoImprimir: !autoPrintConfig.autoImprimir,
      });
      await reloadAutoPrint();
    } catch (err) {
      setAutoPrintError(
        err instanceof DomainServiceError
          ? err.message
          : "No se pudo guardar la autoimpresión.",
      );
    } finally {
      setIsTogglingAutoPrint(false);
    }
  };

  const canAdd =
    !lockedCuenta || !cuentaYaTieneActiva || rows.length === 0;

  const autoImprimirOn = Boolean(autoPrintConfig?.autoImprimir);

  return (
    <ConfiguratorListShell>
      {lockedCuenta ? (
        <div className="mb-4 space-y-2">
          <button
            type="button"
            role="switch"
            aria-checked={autoImprimirOn}
            aria-busy={isAutoPrintLoading || isTogglingAutoPrint}
            disabled={
              isAutoPrintLoading ||
              isTogglingAutoPrint ||
              !autoPrintConfig
            }
            onClick={() => {
              void handleToggleAutoPrint();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
              autoImprimirOn
                ? "border-polaria-t-20 bg-polaria-t-08"
                : "border-polaria-t-20 bg-polaria-bg/40",
              isAutoPrintLoading || isTogglingAutoPrint || !autoPrintConfig
                ? "cursor-not-allowed opacity-50"
                : "hover:border-polaria-teal",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                autoImprimirOn
                  ? "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal"
                  : "border-polaria-w-08 bg-polaria-w-08 text-polaria-w-50",
              )}
            >
              <Printer className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block polaria-text-body-sm font-semibold text-polaria-w">
                Autoimprimir al validar y enviar
              </span>
              <span className="mt-0.5 block polaria-text-caption text-polaria-w-50">
                {autoImprimirOn
                  ? "Al validar y enviar un pedido se imprime solo en la impresora de la cuenta."
                  : "Apagado: imprime solo cuando uses el botón de impresora del listado."}
              </span>
            </span>
            <span
              className={cn(
                "hidden polaria-text-badge sm:inline",
                autoImprimirOn ? "text-polaria-teal" : "text-polaria-w-20",
              )}
            >
              {autoImprimirOn ? "Encendido" : "Apagado"}
            </span>
            <AutoImprimirSwitchTrack on={autoImprimirOn} />
          </button>
          {autoPrintError ? (
            <p
              role="alert"
              className="polaria-text-body-sm text-polaria-danger"
            >
              {autoPrintError}
            </p>
          ) : null}
        </div>
      ) : null}

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
          if (lockedCuenta) void reloadAutoPrint();
        }}
        isRefreshing={isRefreshing}
        primaryAction={
          canAdd
            ? {
                label: "Impresora",
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
