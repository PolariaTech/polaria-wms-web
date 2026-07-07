"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
} from "@/components/shared/table/PolariaTableCells";
import { WmsRol } from "@/constants/wms/roles";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { usePermissions } from "@/hooks/auth/usePermissions";
import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { cn } from "@/lib/utils/cn";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  ESTADO_ORDEN_LABELS,
  ESTADO_SOLICITUD_LABELS,
} from "../../shared/constants/purchases-labels";
import {
  ORDENES_TABLE_MIN_WIDTH_CLASS,
  ordenTableColumnClass,
  SOLICITUDES_TABLE_MIN_WIDTH_CLASS,
  solicitudTableColumnClass,
} from "../../shared/constants/compras-table-layout";
import {
  aprobarSolicitudCompraApi,
  convertirSolicitudCompraAOrdenApi,
  emitirOrdenCompraApi,
  enviarSolicitudCompraAprobacionApi,
} from "../../shared/services/purchases-api.service";
import {
  buildPedidoProveedorRequest,
  notifyProveedorPedido,
} from "../../ordenes/services/pedido-proveedor-client.service";
import {
  listOrdenCompraLineas,
  listOrdenesCompra,
  listSolicitudesCompra,
  updateOrdenCompraDestino,
} from "../../shared/services/purchases.service";
import type { DestinoTipoOrden, OrdenCompraRow, SolicitudCompraRow } from "../../shared/types/purchases.types";
import {
  formatFechaOrden,
  formatObservacionOrden,
  nombresProductosOrden,
  productosOrdenTablaResumen,
} from "../../ordenes/utils/orden-compra-display";
import {
  compareSolicitudCompraByCodigoDesc,
  nombresProductosSolicitud,
  pesosProductosSolicitud,
  productosSolicitudTablaResumen,
} from "../../solicitudes/utils/solicitud-compra-display";
import { OrdenCompraCreateModal } from "../../ordenes/components/OrdenCompraCreateModal";
import { OrdenCompraDetalleModal } from "../../ordenes/components/OrdenCompraDetalleModal";
import { SolicitudCompraCreateModal } from "../../solicitudes/components/SolicitudCompraCreateModal";
import { SolicitudCompraDetalleModal } from "../../solicitudes/components/SolicitudCompraDetalleModal";

type ComprasTab = "solicitudes" | "ordenes";

function formatEstadoOrden(estado: OrdenCompraRow["estado"]): string {
  return ESTADO_ORDEN_LABELS[estado] ?? estado;
}

function formatObservacionesOrden(
  row: OrdenCompraRow,
  notifiedOrdenIds: ReadonlySet<string>,
): string {
  const base = formatObservacionOrden(row.observaciones);
  const notifiedNote = notifiedOrdenIds.has(row.id_orden_compra)
    ? "Proveedor notificado"
    : null;

  if (base !== "—" && notifiedNote) {
    return `${base} — ${notifiedNote}`;
  }

  return base !== "—" ? base : (notifiedNote ?? "—");
}

export function ComprasPageContent() {
  const { codigoCuenta, activeBodegaId } = useCompany();
  const { idRol } = usePermissions();
  const [activeTab, setActiveTab] = useState<ComprasTab>("solicitudes");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOrdenCreateOpen, setIsOrdenCreateOpen] = useState(false);
  const [solicitudDetalle, setSolicitudDetalle] =
    useState<SolicitudCompraRow | null>(null);
  const [ordenDetalle, setOrdenDetalle] = useState<OrdenCompraRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [notifiedOrdenIds, setNotifiedOrdenIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSavingDestino, setIsSavingDestino] = useState(false);
  const [destinoError, setDestinoError] = useState<string | null>(null);

  const puedeAprobarSolicitud =
    idRol === WmsRol.administrador_cuenta || idRol === WmsRol.configurador;

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

  const solicitudesOrdenadas = useMemo(
    () =>
      [...(solicitudes.data ?? [])].sort(compareSolicitudCompraByCodigoDesc),
    [solicitudes.data],
  );

  const runAction = useCallback(
    async (actionId: string, action: () => Promise<unknown>) => {
      setActionError(null);
      setActionSuccess(null);
      setPendingActionId(actionId);

      try {
        await action();
        await Promise.all([solicitudes.reload(), ordenes.reload()]);
        setSolicitudDetalle(null);
        setOrdenDetalle(null);
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

  const handleDestinoChange = useCallback(
    async (patch: {
      destinoTipo?: DestinoTipoOrden;
      fechaEntregaEstimada?: string | null;
    }) => {
      if (!ordenDetalle || !codigoCuenta) {
        return;
      }

      setDestinoError(null);
      setIsSavingDestino(true);

      try {
        await updateOrdenCompraDestino(
          ordenDetalle.id_orden_compra,
          codigoCuenta,
          patch,
        );

        setOrdenDetalle((current) =>
          current
            ? {
                ...current,
                ...(patch.destinoTipo !== undefined
                  ? { destino_tipo: patch.destinoTipo }
                  : {}),
                ...(patch.fechaEntregaEstimada !== undefined
                  ? {
                      fecha_entrega_estimada:
                        patch.fechaEntregaEstimada === null ||
                        patch.fechaEntregaEstimada === ""
                          ? null
                          : patch.fechaEntregaEstimada.includes("T")
                            ? patch.fechaEntregaEstimada
                            : `${patch.fechaEntregaEstimada}T12:00:00.000Z`,
                    }
                  : {}),
              }
            : current,
        );
        await ordenes.reload();
      } catch (err: unknown) {
        setDestinoError(
          err instanceof DomainServiceError
            ? err.message
            : "No se pudo actualizar el destino.",
        );
      } finally {
        setIsSavingDestino(false);
      }
    },
    [codigoCuenta, ordenDetalle, ordenes],
  );

  const solicitudColumns = useMemo(
    () =>
      [
        {
          id: "codigo",
          header: "Solicitud",
          cell: (row: SolicitudCompraRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
          headerClassName: solicitudTableColumnClass("codigo"),
          cellClassName: solicitudTableColumnClass("codigo"),
        },
        {
          id: "productos",
          header: "Productos",
          cell: (row: SolicitudCompraRow) => (
            <TableCellText
              text={productosSolicitudTablaResumen(row)}
              title={nombresProductosSolicitud(row)}
              className="font-medium"
            />
          ),
          headerClassName: solicitudTableColumnClass("productos"),
          cellClassName: solicitudTableColumnClass("productos"),
        },
        {
          id: "peso",
          header: "Peso",
          cell: (row: SolicitudCompraRow) => (
            <TableCellText
              text={pesosProductosSolicitud(row)}
              title={pesosProductosSolicitud(row)}
              className="tabular-nums text-polaria-w-50"
            />
          ),
          headerClassName: solicitudTableColumnClass("peso"),
          cellClassName: solicitudTableColumnClass("peso"),
        },
      ] as const,
    [],
  );

  const renderSolicitudActions = (row: SolicitudCompraRow): ReactNode => {
    const isPending = pendingActionId?.startsWith(row.id_solicitud_compra);

    if (row.estado === "borrador") {
      return (
        <ActionButton
          label="Enviar aprobación"
          primary
          disabled={Boolean(isPending)}
          onClick={() => {
            void runAction(`${row.id_solicitud_compra}:enviar`, () =>
              enviarSolicitudCompraAprobacionApi(row.id_solicitud_compra),
            );
          }}
        />
      );
    }

    if (row.estado === "pendiente_aprobacion" && puedeAprobarSolicitud) {
      return (
        <ActionButton
          label="Aprobar"
          primary
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
          primary
          disabled={Boolean(isPending)}
          onClick={() => {
            void runAction(`${row.id_solicitud_compra}:convertir`, () =>
              convertirSolicitudCompraAOrdenApi(row.id_solicitud_compra),
            );
          }}
        />
      );
    }

    return (
      <PolariaTableBadge variant="neutral">
        {ESTADO_SOLICITUD_LABELS[row.estado] ?? row.estado}
      </PolariaTableBadge>
    );
  };

  const renderOrdenActions = (row: OrdenCompraRow): ReactNode => {
    const isPending = pendingActionId?.startsWith(row.id_orden_compra);

    if (row.estado === "borrador") {
      return (
        <ActionButton
          label="Emitir orden"
          primary
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
      if (notifiedOrdenIds.has(row.id_orden_compra)) {
        return null;
      }

      return (
        <ActionButton
          label={
            pendingActionId === `${row.id_orden_compra}:notificar`
              ? "Enviando…"
              : "Notificar proveedor"
          }
          primary
          disabled={Boolean(isPending)}
          onClick={() => {
            void runNotifyProveedor(row);
          }}
        />
      );
    }

    return notifiedOrdenIds.has(row.id_orden_compra) ? (
      <PolariaTableBadge>Notificado</PolariaTableBadge>
    ) : null;
  };

  const ordenColumns = useMemo(
    () =>
      [
        {
          id: "orden",
          header: "Orden",
          cell: (row: OrdenCompraRow) => (
            <PolariaTableCode>{row.codigo}</PolariaTableCode>
          ),
          headerClassName: ordenTableColumnClass("orden"),
          cellClassName: ordenTableColumnClass("orden"),
        },
        {
          id: "proveedor",
          header: "Proveedor",
          cell: (row: OrdenCompraRow) => (
            <TableCellText
              text={row.proveedor_nombre?.trim() || "—"}
              title={row.proveedor_nombre?.trim() || undefined}
            />
          ),
          headerClassName: ordenTableColumnClass("proveedor"),
          cellClassName: ordenTableColumnClass("proveedor"),
        },
        {
          id: "productos",
          header: "Productos",
          cell: (row: OrdenCompraRow) => (
            <TableCellText
              text={productosOrdenTablaResumen(row)}
              title={nombresProductosOrden(row)}
              className="font-medium"
            />
          ),
          headerClassName: ordenTableColumnClass("productos"),
          cellClassName: ordenTableColumnClass("productos"),
        },
        {
          id: "estado",
          header: "Estado",
          cell: (row: OrdenCompraRow) => (
            <PolariaTableBadge variant="neutral">
              {formatEstadoOrden(row.estado)}
            </PolariaTableBadge>
          ),
          headerClassName: ordenTableColumnClass("estado"),
          cellClassName: ordenTableColumnClass("estado"),
        },
        {
          id: "fecha",
          header: "Fecha",
          cell: (row: OrdenCompraRow) => formatFechaOrden(row.fecha_emision),
          headerClassName: ordenTableColumnClass("fecha"),
          cellClassName: ordenTableColumnClass("fecha"),
        },
        {
          id: "observacion",
          header: "Observación",
          cell: (row: OrdenCompraRow) => {
            const text = formatObservacionesOrden(row, notifiedOrdenIds);
            return (
              <TableCellText
                text={text}
                title={text !== "—" ? text : undefined}
                className="text-polaria-w-50"
              />
            );
          },
          headerClassName: ordenTableColumnClass("observacion"),
          cellClassName: ordenTableColumnClass("observacion"),
        },
      ] as const,
    [notifiedOrdenIds],
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
          subtitle="Solicitud · productos · peso kg"
          isLoading={solicitudes.isLoading}
          error={solicitudes.error ?? tenantError}
          rows={solicitudesOrdenadas}
          columns={solicitudColumns}
          getRowKey={(row) => row.id_solicitud_compra}
          emptyMessage="No hay solicitudes. Usá «Nueva solicitud» para crear la primera."
          onRefresh={() => {
            void solicitudes.reload();
          }}
          isRefreshing={solicitudes.isRefreshing}
          onRowClick={(row) => setSolicitudDetalle(row)}
          getRowAriaLabel={(row) => `Ver detalle de solicitud ${row.codigo}`}
          tableClassName={SOLICITUDES_TABLE_MIN_WIDTH_CLASS}
          primaryAction={{
            label: "Nueva solicitud",
            onClick: () => setIsCreateOpen(true),
          }}
        />
      ) : (
        <PolariaDataTable
          title="Órdenes de compra"
          subtitle="Orden · proveedor · productos · estado · fecha"
          isLoading={ordenes.isLoading}
          error={ordenes.error ?? tenantError}
          rows={ordenes.data ?? []}
          columns={ordenColumns}
          getRowKey={(row) => row.id_orden_compra}
          emptyMessage="Sin órdenes de compra. Usá «Nueva orden» para crear la primera."
          onRefresh={() => {
            void ordenes.reload();
          }}
          isRefreshing={ordenes.isRefreshing}
          onRowClick={(row) => setOrdenDetalle(row)}
          getRowAriaLabel={(row) => `Ver detalle de orden ${row.codigo}`}
          tableClassName={ORDENES_TABLE_MIN_WIDTH_CLASS}
          primaryAction={{
            label: "Nueva orden",
            onClick: () => setIsOrdenCreateOpen(true),
          }}
        />
      )}

      <SolicitudCompraCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void solicitudes.reload();
        }}
      />

      <OrdenCompraCreateModal
        open={isOrdenCreateOpen}
        onClose={() => setIsOrdenCreateOpen(false)}
        onCreated={() => {
          void ordenes.reload();
        }}
      />

      {solicitudDetalle ? (
        <SolicitudCompraDetalleModal
          solicitud={solicitudDetalle}
          onClose={() => setSolicitudDetalle(null)}
          actions={renderSolicitudActions(solicitudDetalle)}
        />
      ) : null}

      {ordenDetalle ? (
        <OrdenCompraDetalleModal
          orden={ordenDetalle}
          onClose={() => {
            setOrdenDetalle(null);
            setDestinoError(null);
          }}
          actions={renderOrdenActions(ordenDetalle)}
          notified={notifiedOrdenIds.has(ordenDetalle.id_orden_compra)}
          onDestinoChange={
            ordenDetalle.estado === "borrador"
              ? handleDestinoChange
              : undefined
          }
          isSavingDestino={isSavingDestino}
          destinoError={destinoError}
        />
      ) : null}
    </div>
  );
}

function TableCellText({
  text,
  title,
  className,
}: {
  text: string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(className)}
      title={title ?? (text !== "—" ? text : undefined)}
    >
      {text}
    </span>
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
  primary = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-w-[7rem] items-center justify-center rounded-xl px-4 py-2.5 polaria-text-body-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        primary
          ? "bg-polaria-teal text-polaria-bg hover:opacity-90"
          : "border border-polaria-teal text-polaria-teal hover:bg-polaria-t-08",
      )}
    >
      {label}
    </button>
  );
}
