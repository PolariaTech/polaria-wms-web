"use client";

import { useMemo, type ReactNode } from "react";
import { PolariaTableBadge, PolariaTableCode } from "@/components/shared/table/PolariaTableCells";
import { ESTADO_SOLICITUD_LABELS } from "../../shared/constants/purchases-labels";
import {
  ordenTableColumnClass,
  solicitudTableColumnClass,
} from "../../shared/constants/compras-table-layout";
import type { OrdenCompraRow, SolicitudCompraRow } from "../../shared/types/purchases.types";
import {
  formatFechaOrden,
  isOrdenDestinoListoParaEmitir,
  nombresProductosOrden,
  productosOrdenTablaResumen,
} from "../../ordenes/utils/orden-compra-display";
import {
  nombresProductosSolicitud,
  pesosProductosSolicitud,
  productosSolicitudTablaResumen,
} from "../../solicitudes/utils/solicitud-compra-display";
import { ActionButton, TableCellText } from "./compras-page-content.ui";
import {
  formatEstadoOrden,
  formatObservacionesOrden,
} from "./compras-page-content.display";
import {
  aprobarSolicitudCompraApi,
  convertirSolicitudCompraAOrdenApi,
  emitirOrdenCompraApi,
} from "../../shared/services/purchases-api.service";
import type { ComprasPageTableCtx } from "./compras-page-content.table-types";

export function useComprasPageTables(ctx: ComprasPageTableCtx) {
  const {
    puedeAprobarSolicitud,
    pendingActionId,
    pickingSolicitud,
    notifiedOrdenIds,
    startEnviarAprobacion,
    runAction,
    runNotifyProveedor,
  } = ctx;
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
    const isPickingProveedor =
      pickingSolicitud?.id_solicitud_compra === row.id_solicitud_compra;

    if (row.estado === "borrador") {
      return (
        <ActionButton
          label="Enviar aprobación"
          primary
          disabled={Boolean(isPending) || isPickingProveedor}
          onClick={() => {
            startEnviarAprobacion(row);
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
      const destinoListo = isOrdenDestinoListoParaEmitir(row);

      return (
        <ActionButton
          label="Emitir orden"
          primary
          disabled={Boolean(isPending) || !destinoListo}
          title={
            destinoListo
              ? undefined
              : "Selecciona tipo y bodega destino con capacidad disponible."
          }
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

  return {
    solicitudColumns,
    renderSolicitudActions,
    renderOrdenActions,
    ordenColumns,
  };
}
