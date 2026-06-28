"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { PolariaDataTable } from "@/components/shared/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/PolariaTableCells";
import { formatDateTime } from "@/components/shared/formatters";
import { useAsyncQuery } from "@/hooks/useAsyncQuery";
import { DomainServiceError } from "@/lib/domain-service-error";
import { cn } from "@/lib/cn";
import { useCompany } from "@/providers/CompanyProvider";
import {
  ESTADO_ORDEN_LABELS,
  ESTADO_SOLICITUD_LABELS,
} from "../constants/purchases-labels";
import {
  aprobarSolicitudCompraApi,
  convertirSolicitudCompraAOrdenApi,
  emitirOrdenCompraApi,
  enviarSolicitudCompraAprobacionApi,
} from "../services/purchases-api.service";
import {
  buildPedidoProveedorRequest,
  notifyProveedorPedido,
} from "../services/pedido-proveedor-client.service";
import {
  listOrdenCompraLineas,
  listOrdenesCompra,
  listSolicitudesCompra,
} from "../services/purchases.service";
import type { OrdenCompraRow, SolicitudCompraRow } from "../types/purchases.types";
import { SolicitudCompraCreateModal } from "./SolicitudCompraCreateModal";

type ComprasTab = "solicitudes" | "ordenes";

function formatEstadoSolicitud(estado: SolicitudCompraRow["estado"]): string {
  return ESTADO_SOLICITUD_LABELS[estado] ?? estado;
}

function formatEstadoOrden(estado: OrdenCompraRow["estado"]): string {
  return ESTADO_ORDEN_LABELS[estado] ?? estado;
}

function formatObservacionesOrden(
  row: OrdenCompraRow,
  notifiedOrdenIds: ReadonlySet<string>,
): string {
  const base = row.observaciones?.trim();
  const notifiedNote = notifiedOrdenIds.has(row.id_orden_compra)
    ? "Proveedor notificado"
    : null;

  if (base && notifiedNote) {
    return `${base} — ${notifiedNote}`;
  }

  return base ?? notifiedNote ?? "—";
}

export function ComprasPageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const [activeTab, setActiveTab] = useState<ComprasTab>("solicitudes");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [notifiedOrdenIds, setNotifiedOrdenIds] = useState<Set<string>>(
    () => new Set(),
  );

  const fetchSolicitudes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listSolicitudesCompra({
      codigoCuenta,
      idBodega: activeBodegaId,
    });
  }, [activeBodegaId, codigoCuenta]);

  const fetchOrdenes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listOrdenesCompra({
      codigoCuenta,
      idBodega: activeBodegaId,
    });
  }, [activeBodegaId, codigoCuenta]);

  const solicitudes = useAsyncQuery(fetchSolicitudes, Boolean(codigoCuenta));
  const ordenes = useAsyncQuery(fetchOrdenes, Boolean(codigoCuenta));

  const runAction = useCallback(
    async (actionId: string, action: () => Promise<unknown>) => {
      setActionError(null);
      setActionSuccess(null);
      setPendingActionId(actionId);

      try {
        await action();
        await Promise.all([solicitudes.reload(), ordenes.reload()]);
      } catch (err: unknown) {
        setActionError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo completar la acción.",
        );
      } finally {
        setPendingActionId(null);
      }
    },
    [ordenes, solicitudes],
  );

  const runNotifyProveedor = useCallback(
    async (orden: OrdenCompraRow) => {
      const actionId = `${orden.id_orden_compra}:notificar`;
      setActionError(null);
      setActionSuccess(null);
      setPendingActionId(actionId);

      try {
        const lineas = await listOrdenCompraLineas(orden.id_orden_compra);
        const result = await notifyProveedorPedido(
          buildPedidoProveedorRequest(orden, lineas),
        );

        setNotifiedOrdenIds((current) => {
          const next = new Set(current);
          next.add(orden.id_orden_compra);
          return next;
        });
        setActionSuccess(
          result.correlationId
            ? `Proveedor notificado (ref. ${result.correlationId.slice(0, 8)}).`
            : "Proveedor notificado correctamente.",
        );
      } catch (err: unknown) {
        setActionError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo notificar al proveedor.",
        );
      } finally {
        setPendingActionId(null);
      }
    },
    [],
  );

  const solicitudColumns = useMemo(
    () =>
      [
        {
          id: "codigo",
          header: "Código",
          cell: (row: SolicitudCompraRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: SolicitudCompraRow) => (
            <PolariaTableBadge variant="neutral">
              {formatEstadoSolicitud(row.estado)}
            </PolariaTableBadge>
          ),
        },
        {
          id: "proveedor",
          header: "Proveedor",
          cell: (row: SolicitudCompraRow) => row.id_proveedor ?? "—",
          cellClassName: "font-mono text-xs text-polaria-w-50",
        },
        {
          id: "bodega",
          header: "Bodega",
          cell: (row: SolicitudCompraRow) => row.id_bodega,
          cellClassName: "font-mono text-xs text-polaria-w-50",
        },
        {
          id: "created",
          header: "Creada",
          cell: (row: SolicitudCompraRow) => formatDateTime(row.created_at),
          cellClassName: "text-polaria-w-50",
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: SolicitudCompraRow) => {
            const isPending = pendingActionId?.startsWith(row.id_solicitud_compra);

            if (row.estado === "borrador") {
              return (
                <ActionButton
                  label="Enviar aprobación"
                  disabled={Boolean(isPending)}
                  onClick={() => {
                    void runAction(`${row.id_solicitud_compra}:enviar`, () =>
                      enviarSolicitudCompraAprobacionApi(row.id_solicitud_compra),
                    );
                  }}
                />
              );
            }

            if (row.estado === "pendiente_aprobacion") {
              return (
                <ActionButton
                  label="Aprobar"
                  disabled={Boolean(isPending)}
                  onClick={() => {
                    void runAction(`${row.id_solicitud_compra}:aprobar`, () =>
                      aprobarSolicitudCompraApi(row.id_solicitud_compra),
                    );
                  }}
                />
              );
            }

            if (row.estado === "aprobada") {
              return (
                <ActionButton
                  label="Convertir a OC"
                  disabled={Boolean(isPending)}
                  onClick={() => {
                    void runAction(`${row.id_solicitud_compra}:convertir`, () =>
                      convertirSolicitudCompraAOrdenApi(row.id_solicitud_compra),
                    );
                  }}
                />
              );
            }

            return "—";
          },
        },
      ] as const,
    [pendingActionId, runAction],
  );

  const ordenColumns = useMemo(
    () =>
      [
        {
          id: "codigo",
          header: "Código",
          cell: (row: OrdenCompraRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: OrdenCompraRow) => (
            <PolariaTableBadge variant="neutral">
              {formatEstadoOrden(row.estado)}
            </PolariaTableBadge>
          ),
        },
        {
          id: "proveedor",
          header: "Proveedor",
          cell: (row: OrdenCompraRow) => row.id_proveedor,
          cellClassName: "font-mono text-xs text-polaria-w-50",
        },
        {
          id: "emision",
          header: "Emisión",
          cell: (row: OrdenCompraRow) => formatDateTime(row.fecha_emision),
          cellClassName: "text-polaria-w-50",
        },
        {
          id: "observaciones",
          header: "Observaciones",
          cell: (row: OrdenCompraRow) =>
            formatObservacionesOrden(row, notifiedOrdenIds),
          cellClassName: "text-polaria-w-50",
        },
        {
          id: "acciones",
          header: "Acciones",
          cell: (row: OrdenCompraRow) => {
            const isPending = pendingActionId?.startsWith(row.id_orden_compra);

            if (row.estado === "borrador") {
              return (
                <ActionButton
                  label="Emitir OC"
                  disabled={Boolean(isPending)}
                  onClick={() => {
                    void runAction(`${row.id_orden_compra}:emitir`, () =>
                      emitirOrdenCompraApi(row.id_orden_compra),
                    );
                  }}
                />
              );
            }

            if (row.estado === "emitida") {
              return (
                <div className="flex flex-wrap items-center gap-2">
                  {notifiedOrdenIds.has(row.id_orden_compra) ? (
                    <PolariaTableBadge>Notificado</PolariaTableBadge>
                  ) : null}
                  <ActionButton
                    label={
                      pendingActionId === `${row.id_orden_compra}:notificar`
                        ? "Enviando…"
                        : "Notificar proveedor"
                    }
                    disabled={Boolean(isPending)}
                    onClick={() => {
                      void runNotifyProveedor(row);
                    }}
                  />
                </div>
              );
            }

            return notifiedOrdenIds.has(row.id_orden_compra) ? (
              <PolariaTableBadge>Notificado</PolariaTableBadge>
            ) : (
              "—"
            );
          },
        },
      ] as const,
    [notifiedOrdenIds, pendingActionId, runAction, runNotifyProveedor],
  );

  const tenantError =
    !codigoCuenta ? "No se encontró la cuenta activa." : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <TabButton
          active={activeTab === "solicitudes"}
          onClick={() => setActiveTab("solicitudes")}
        >
          Solicitudes
        </TabButton>
        <TabButton
          active={activeTab === "ordenes"}
          onClick={() => setActiveTab("ordenes")}
        >
          Órdenes
        </TabButton>
      </div>

      {actionError ? (
        <p
          role="alert"
          className="rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 text-polaria-w-50"
        >
          {actionError}
        </p>
      ) : null}

      {actionSuccess ? (
        <p
          role="status"
          className="rounded-xl border border-polaria-w-08 bg-polaria-w-08 px-4 py-3 polaria-text-body-sm text-polaria-w-50"
        >
          {actionSuccess}
        </p>
      ) : null}

      {activeTab === "solicitudes" ? (
        <PolariaDataTable
          title="Solicitudes de compra"
          subtitle="Flujo de aprobación y conversión a orden."
          isLoading={solicitudes.isLoading}
          error={solicitudes.error ?? tenantError}
          rows={solicitudes.data ?? []}
          columns={solicitudColumns}
          getRowKey={(row) => row.id_solicitud_compra}
          emptyMessage="Sin solicitudes de compra registradas."
          onRefresh={() => {
            void solicitudes.reload();
          }}
          isRefreshing={solicitudes.isRefreshing}
          primaryAction={{
            label: "Nueva solicitud",
            onClick: () => setIsCreateOpen(true),
          }}
        />
      ) : (
        <PolariaDataTable
          title="Órdenes de compra"
          subtitle="Emisión y seguimiento de OC."
          isLoading={ordenes.isLoading}
          error={ordenes.error ?? tenantError}
          rows={ordenes.data ?? []}
          columns={ordenColumns}
          getRowKey={(row) => row.id_orden_compra}
          emptyMessage="Sin órdenes de compra registradas."
          onRefresh={() => {
            void ordenes.reload();
          }}
          isRefreshing={ordenes.isRefreshing}
        />
      )}

      <SolicitudCompraCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void solicitudes.reload();
        }}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-polaria-teal text-polaria-bg"
          : "border border-polaria-t-20 text-polaria-w-50 hover:bg-polaria-t-08",
      )}
    >
      {children}
    </button>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-polaria-teal px-3 py-1.5 text-sm text-polaria-teal transition hover:bg-polaria-t-08 disabled:opacity-50"
    >
      {label}
    </button>
  );
}
