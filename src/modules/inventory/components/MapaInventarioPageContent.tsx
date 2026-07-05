"use client";

import { useCallback, useState } from "react";
import { ModuleListPage } from "@/components/shared/ModuleListPage";
import { formatDateTime } from "@/components/shared/formatters";
import { useWarehouseStateRealtime } from "@/hooks/useWarehouseStateRealtime";
import { usePermissions } from "@/hooks/usePermissions";
import { DomainServiceError } from "@/lib/domain-service-error";
import { useCompany } from "@/providers/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";
import {
  canForceUnlockWarehouseState,
  canLockWarehouseState,
} from "../constants/inventory-lock.constants";
import {
  lockWarehouseStateApi,
  unlockWarehouseStateApi,
} from "../services/inventory-api.service";
import type { WarehouseStateRow } from "../types/inventory.types";

function formatLockLabel(
  row: WarehouseStateRow,
  currentUserId: string | null | undefined,
): string {
  if (!row.locked_by) {
    return "Libre";
  }

  if (currentUserId && row.locked_by === currentUserId) {
    return "Bloqueado por ti";
  }

  return `Bloqueado (${row.locked_by.slice(0, 8)}…)`;
}

export function MapaInventarioPageContent() {
  const { activeBodegaId, codigoCuenta } = useCompany();
  const { idRol } = usePermissions();
  const currentUserId = useAuthStore((state) => state.session?.idUsuario);
  const { rows, isConnected, isLoading, error, lastEventAt } =
    useWarehouseStateRealtime();

  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);

  const puedeBloquear = canLockWarehouseState(idRol);
  const puedeForzarUnlock = canForceUnlockWarehouseState(idRol);

  const runLockAction = useCallback(
    async (
      row: WarehouseStateRow,
      action: "lock" | "unlock",
    ) => {
      if (!codigoCuenta || !activeBodegaId) {
        setActionError("Falta cuenta o bodega activa.");
        return;
      }

      setActionError(null);
      setPendingRowId(row.id_warehouse_state);

      try {
        const input = {
          codigoCuenta,
          idBodega: activeBodegaId,
          expectedVersion: row.version,
        };

        if (action === "lock") {
          await lockWarehouseStateApi(row.id_warehouse_state, input);
        } else {
          await unlockWarehouseStateApi(row.id_warehouse_state, input);
        }
      } catch (err: unknown) {
        setActionError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo actualizar el bloqueo.",
        );
      } finally {
        setPendingRowId(null);
      }
    },
    [activeBodegaId, codigoCuenta],
  );

  const renderLockActions = (row: WarehouseStateRow) => {
    if (!puedeBloquear) {
      return <span className="polaria-text-body-sm text-polaria-w-50">—</span>;
    }

    const isPending = pendingRowId === row.id_warehouse_state;
    const lockedByMe = Boolean(
      row.locked_by && currentUserId && row.locked_by === currentUserId,
    );
    const lockedByOther = Boolean(row.locked_by && !lockedByMe);

    if (!row.locked_by) {
      return (
        <button
          type="button"
          disabled={isPending}
          onClick={() => void runLockAction(row, "lock")}
          className="rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-3 py-1.5 polaria-text-body-sm font-medium text-polaria-teal hover:bg-polaria-t-20 transition-colors disabled:opacity-50"
        >
          {isPending ? "…" : "Bloquear"}
        </button>
      );
    }

    if (lockedByMe || (lockedByOther && puedeForzarUnlock)) {
      return (
        <button
          type="button"
          disabled={isPending}
          onClick={() => void runLockAction(row, "unlock")}
          className="rounded-lg border border-polaria-w-08 bg-polaria-w-08 px-3 py-1.5 polaria-text-body-sm font-medium text-polaria-w hover:bg-polaria-w-20 transition-colors disabled:opacity-50"
        >
          {isPending ? "…" : lockedByOther ? "Forzar liberar" : "Liberar"}
        </button>
      );
    }

    return (
      <span className="polaria-text-body-sm text-polaria-w-50">Ocupado</span>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="polaria-text-body-sm text-polaria-w-50">
          Bodega activa:{" "}
          <span className="text-polaria-w">{activeBodegaId ?? "—"}</span>
        </p>
        {isConnected ? (
          <span
            className="polaria-text-badge inline-flex items-center gap-2 rounded-full border border-polaria-t-20 bg-polaria-t-08 px-3 py-1.5 text-polaria-teal"
            aria-live="polite"
          >
            <span
              aria-hidden
              className="h-2 w-2 animate-pulse rounded-full bg-polaria-teal polaria-teal-glow"
            />
            En vivo
          </span>
        ) : null}
      </div>

      {lastEventAt ? (
        <p className="polaria-text-body-sm text-polaria-w-20">
          Último evento:{" "}
          {lastEventAt.toLocaleString("es-CL", {
            dateStyle: "short",
            timeStyle: "medium",
          })}
        </p>
      ) : null}

      {actionError ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 polaria-text-body-sm text-polaria-danger"
        >
          {actionError}
        </p>
      ) : null}

      <ModuleListPage
        isLoading={isLoading}
        error={error}
        rows={rows}
        emptyMessage="Sin posiciones de inventario en esta bodega."
        getRowKey={(row) => row.id_warehouse_state}
        columns={[
          {
            id: "ubicacion",
            header: "Ubicación",
            cell: (row) => row.id_ubicacion,
            cellClassName: "font-mono text-xs",
          },
          {
            id: "producto",
            header: "Producto",
            cell: (row) => row.id_producto,
            cellClassName: "font-mono text-xs",
          },
          {
            id: "lote",
            header: "Lote",
            cell: (row) => row.id_lote ?? "—",
            cellClassName: "font-mono text-xs text-polaria-w-50",
          },
          { id: "cantidad", header: "Cantidad", cell: (row) => row.cantidad },
          {
            id: "reservada",
            header: "Reservada",
            cell: (row) => row.cantidad_reservada,
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "temperatura",
            header: "Temp.",
            cell: (row) => row.temperatura ?? "—",
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "bloqueo",
            header: "Bloqueo",
            cell: (row) => formatLockLabel(row, currentUserId),
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "updated",
            header: "Actualizado",
            cell: (row) => formatDateTime(row.updated_at),
            cellClassName: "text-polaria-w-50",
          },
          {
            id: "acciones",
            header: "Acciones",
            cell: (row) => renderLockActions(row),
          },
        ]}
      />
    </div>
  );
}
