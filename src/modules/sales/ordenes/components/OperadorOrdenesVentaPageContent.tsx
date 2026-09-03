"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableDownloadButton,
  PolariaTablePrintButton,
} from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import { formatEstadoOrdenVenta } from "../../shared/constants/sales-status";
import { useOrdenesVentaSubscription } from "../../shared/hooks/useOrdenesVentaSubscription";
import {
  ORDENES_VENTA_TABLE_MIN_WIDTH_CLASS,
  ordenVentaTableColumnClass,
} from "../constants/ordenes-venta-table-layout";
import {
  downloadOrdenTareaAlmacenPdf,
  printOrdenTareaAlmacen,
} from "../print/download-orden-tarea-almacen-pdf";
import { mapOrdenVentaToAlmacenPrintData } from "../print/map-orden-tarea-almacen";
import {
  getOrdenVentaDetalle,
  listOrdenesVentaOperador,
} from "../../shared/services/sales.service";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { OrdenVentaCreateModal } from "./OrdenVentaCreateModal";
import { OrdenVentaDetalleModal } from "./OrdenVentaDetalleModal";

function renderEstadoBadge(estado: string) {
  const normalized = estado.toLowerCase();
  const variant =
    normalized === "despachada" || normalized === "cerrada"
      ? "positive"
      : normalized === "cancelada"
        ? "neutral"
        : normalized === "confirmada" || normalized === "en_preparacion"
          ? "warning"
          : "neutral";

  return (
    <PolariaTableBadge variant={variant}>
      {formatEstadoOrdenVenta(estado)}
    </PolariaTableBadge>
  );
}

export function OperadorOrdenesVentaPageContent() {
  const { codigoCuenta } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const printingLockRef = useRef(false);
  const [busyAction, setBusyAction] = useState<{
    id: string;
    kind: "print" | "download";
  } | null>(null);

  const fetchOrdenes = useCallback(() => {
    if (!codigoCuenta) {
      return Promise.resolve([]);
    }

    return listOrdenesVentaOperador({ codigoCuenta });
  }, [codigoCuenta]);

  const { data, isLoading, isRefreshing, error, reload } = useAsyncQuery(
    fetchOrdenes,
    Boolean(codigoCuenta),
  );

  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reloadRealtime = useCallback(() => {
    if (reloadTimerRef.current) {
      clearTimeout(reloadTimerRef.current);
    }
    reloadTimerRef.current = setTimeout(() => {
      void reload();
    }, 250);
  }, [reload]);

  useOrdenesVentaSubscription(codigoCuenta, reloadRealtime);

  useEffect(() => {
    return () => {
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
    };
  }, []);

  const rows = data ?? [];

  const loadPrintData = useCallback(
    async (row: OrdenVentaOperadorRow) => {
      let detalle = null;
      if (codigoCuenta) {
        try {
          detalle = await getOrdenVentaDetalle({
            codigoCuenta,
            idOrdenVenta: row.idOrdenVenta,
          });
        } catch {
          detalle = null;
        }
      }

      return mapOrdenVentaToAlmacenPrintData({ listRow: row, detalle });
    },
    [codigoCuenta],
  );

  const runOrdenOutput = useCallback(
    async (
      row: OrdenVentaOperadorRow,
      kind: "print" | "download",
    ) => {
      if (!codigoCuenta || printingLockRef.current) return;
      printingLockRef.current = true;
      setBusyAction({ id: row.idOrdenVenta, kind });

      try {
        const data = await loadPrintData(row);
        if (kind === "print") {
          await printOrdenTareaAlmacen(data);
        } else {
          await downloadOrdenTareaAlmacenPdf(data);
        }
      } finally {
        printingLockRef.current = false;
        setBusyAction(null);
      }
    },
    [codigoCuenta, loadPrintData],
  );

  const columns = useMemo(
    () => [
      {
        id: "venta",
        header: "Venta",
        headerClassName: ordenVentaTableColumnClass("venta", "header"),
        cellClassName: ordenVentaTableColumnClass("venta"),
        cell: (row: OrdenVentaOperadorRow) => (
          <PolariaTableCode>{row.venta}</PolariaTableCode>
        ),
      },
      {
        id: "comprador",
        header: "Comprador",
        headerClassName: ordenVentaTableColumnClass("comprador", "header"),
        cellClassName: ordenVentaTableColumnClass("comprador"),
        cell: (row: OrdenVentaOperadorRow) => row.comprador,
      },
      {
        id: "productos",
        header: "Productos",
        headerClassName: ordenVentaTableColumnClass("productos", "header"),
        cellClassName: ordenVentaTableColumnClass("productos"),
        cell: (row: OrdenVentaOperadorRow) => row.productos,
      },
      {
        id: "cantidadKg",
        header: "Cantidad (kg)",
        headerClassName: ordenVentaTableColumnClass("cantidadKg", "header"),
        cellClassName: ordenVentaTableColumnClass("cantidadKg"),
        cell: (row: OrdenVentaOperadorRow) => `${formatKgEs(row.cantidadKg)} kg`,
      },
      {
        id: "total",
        header: "Total",
        headerClassName: ordenVentaTableColumnClass("total", "header"),
        cellClassName: ordenVentaTableColumnClass("total"),
        cell: (row: OrdenVentaOperadorRow) => `$${formatPrecioEs(row.total)}`,
      },
      {
        id: "estado",
        header: "Estado",
        headerClassName: ordenVentaTableColumnClass("estado", "header"),
        cellClassName: ordenVentaTableColumnClass("estado"),
        cell: (row: OrdenVentaOperadorRow) => renderEstadoBadge(row.estado),
      },
      {
        id: "fecha",
        header: "Fecha",
        headerClassName: ordenVentaTableColumnClass("fecha", "header"),
        cellClassName: ordenVentaTableColumnClass("fecha"),
        cell: (row: OrdenVentaOperadorRow) => formatDateTime(row.fecha),
      },
      {
        id: "origen",
        header: "Origen",
        headerClassName: ordenVentaTableColumnClass("origen", "header"),
        cellClassName: ordenVentaTableColumnClass("origen"),
        cell: () => "—",
      },
      {
        id: "imprimir",
        header: "Imprimir",
        headerClassName: ordenVentaTableColumnClass("imprimir", "header"),
        cellClassName: ordenVentaTableColumnClass("imprimir"),
        cell: (row: OrdenVentaOperadorRow) => (
          <span
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <PolariaTablePrintButton
              onClick={() => {
                void runOrdenOutput(row, "print");
              }}
              disabled={
                busyAction?.id === row.idOrdenVenta &&
                busyAction.kind === "print"
              }
            />
          </span>
        ),
      },
      {
        id: "descargar",
        header: "Descargar",
        headerClassName: ordenVentaTableColumnClass("descargar", "header"),
        cellClassName: ordenVentaTableColumnClass("descargar"),
        cell: (row: OrdenVentaOperadorRow) => (
          <span
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <PolariaTableDownloadButton
              onClick={() => {
                void runOrdenOutput(row, "download");
              }}
              disabled={
                busyAction?.id === row.idOrdenVenta &&
                busyAction.kind === "download"
              }
            />
          </span>
        ),
      },
    ],
    [runOrdenOutput, busyAction],
  );

  return (
    <>
      <PolariaDataTable
        title="Órdenes de venta"
        subtitle="Venta, comprador y estado."
        isLoading={isLoading}
        error={
          error ??
          (!codigoCuenta ? "No se encontró la cuenta activa." : null)
        }
        rows={rows}
        columns={columns}
        getRowKey={(row) => row.idOrdenVenta}
        emptyMessage="Sin órdenes de venta registradas."
        onRefresh={() => {
          void reload();
        }}
        isRefreshing={isRefreshing}
        primaryAction={{
          label: "Nueva venta",
          onClick: () => {
            if (!codigoCuenta) return;
            setIsCreateOpen(true);
          },
        }}
        onRowClick={(row) => setDetalleId(row.idOrdenVenta)}
        getRowAriaLabel={(row) => `Ver detalle de venta ${row.venta}`}
        tableClassName={ORDENES_VENTA_TABLE_MIN_WIDTH_CLASS}
      />

      <OrdenVentaDetalleModal
        idOrdenVenta={detalleId}
        codigoCuenta={codigoCuenta}
        onClose={() => setDetalleId(null)}
        onEmitted={() => {
          void reload();
        }}
      />

      <OrdenVentaCreateModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          void reload();
        }}
      />
    </>
  );
}
