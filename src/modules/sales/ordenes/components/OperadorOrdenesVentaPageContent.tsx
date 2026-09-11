"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PolariaDataTable } from "@/components/shared/table/PolariaDataTable";
import {
  PolariaTableActionGroup,
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableDownloadButton,
  PolariaTableEditButton,
  PolariaTablePrintButton,
} from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { formatPrecioEs } from "@/lib/utils/decimal-es";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { useCompany } from "@/providers/tenant/CompanyProvider";
import {
  formatEstadoOrdenVenta,
  puedeEditarOrdenVenta,
} from "../../shared/constants/sales-status";
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
import { listOrdenIdsConSurtidoCaptura } from "../surtido/list-orden-ids-con-surtido-captura";
import { OrdenVentaCreateModal } from "./OrdenVentaCreateModal";
import { OrdenVentaDetalleModal } from "./OrdenVentaDetalleModal";

interface OrdenesVentaPageData {
  rows: OrdenVentaOperadorRow[];
  idsConPdfActualizado: Set<string>;
}
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const printingLockRef = useRef(false);
  const [busyAction, setBusyAction] = useState<{
    id: string;
    kind: "print" | "download" | "updated";
  } | null>(null);

  const fetchOrdenes = useCallback(async (): Promise<OrdenesVentaPageData> => {
    if (!codigoCuenta) {
      return { rows: [], idsConPdfActualizado: new Set() };
    }

    const rows = await listOrdenesVentaOperador({ codigoCuenta });
    let idsConPdfActualizado = new Set<string>();
    try {
      idsConPdfActualizado = await listOrdenIdsConSurtidoCaptura({
        codigoCuenta,
        idOrdenes: rows.map((row) => row.idOrdenVenta),
      });
    } catch {
      idsConPdfActualizado = new Set();
    }
    return { rows, idsConPdfActualizado };
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

  const rows = data?.rows ?? [];
  const idsConPdfActualizado = useMemo(
    () => data?.idsConPdfActualizado ?? new Set<string>(),
    [data],
  );

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
      kind: "print" | "download" | "updated",
    ) => {
      if (!codigoCuenta || printingLockRef.current) return;
      printingLockRef.current = true;
      setBusyAction({ id: row.idOrdenVenta, kind });

      try {
        const data = await loadPrintData(row);
        if (kind === "print") {
          await printOrdenTareaAlmacen(data, { codigoCuenta });
          return;
        }
        if (kind === "download") {
          await downloadOrdenTareaAlmacenPdf(data);
          return;
        }

        const response = await fetch(
          `/captura-orden/${encodeURIComponent(row.idOrdenVenta)}/api`,
        );
        const body = (await response.json()) as {
          error?: string;
          captura?: { payload: import("../surtido/orden-surtido.types").OrdenSurtidoCapturaPayload } | null;
        };
        if (!response.ok) {
          throw new Error(body.error || "No se pudo cargar la captura.");
        }
        if (!body.captura?.payload) {
          window.alert(
            "Aún no hay PDF actualizado. El jefe debe escanear el QR y subir la foto de la hoja llenada.",
          );
          return;
        }
        const { applySurtidoToPrintData } = await import(
          "../surtido/apply-surtido-to-print"
        );
        const updated = applySurtidoToPrintData(data, body.captura.payload);
        await downloadOrdenTareaAlmacenPdf(updated, {
          filenameSuffix: "actualizado",
        });
      } catch (error: unknown) {
        window.alert(
          error instanceof Error
            ? error.message
            : "No se pudo generar el PDF.",
        );
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
        cell: (row: OrdenVentaOperadorRow) => (
          <span className="block max-w-[9.5rem] truncate" title={row.comprador}>
            {row.comprador}
          </span>
        ),
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
        id: "acciones",
        header: "Acciones",
        headerClassName: ordenVentaTableColumnClass("acciones", "header"),
        cellClassName: ordenVentaTableColumnClass("acciones"),
        cell: (row: OrdenVentaOperadorRow) => {
          const hasPdfActualizado = idsConPdfActualizado.has(row.idOrdenVenta);
          const busyId = busyAction?.id === row.idOrdenVenta;
          return (
            <span
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <PolariaTableActionGroup>
                <PolariaTableEditButton
                  label={
                    puedeEditarOrdenVenta(row.estado)
                      ? "Editar"
                      : "Esta orden ya no se puede editar"
                  }
                  disabled={!puedeEditarOrdenVenta(row.estado)}
                  onClick={() => {
                    if (!puedeEditarOrdenVenta(row.estado)) return;
                    setEditingId(row.idOrdenVenta);
                    setIsCreateOpen(true);
                  }}
                />
                <PolariaTablePrintButton
                  onClick={() => {
                    void runOrdenOutput(row, "print");
                  }}
                  disabled={busyId && busyAction?.kind === "print"}
                />
                <PolariaTableDownloadButton
                  onClick={() => {
                    void runOrdenOutput(row, "download");
                  }}
                  disabled={busyId && busyAction?.kind === "download"}
                />
                <PolariaTableDownloadButton
                  label="Descargar PDF actualizado (surtido)"
                  onClick={() => {
                    void runOrdenOutput(row, "updated");
                  }}
                  disabled={
                    !hasPdfActualizado ||
                    (busyId && busyAction?.kind === "updated")
                  }
                />
              </PolariaTableActionGroup>
            </span>
          );
        },
      },
    ],
    [runOrdenOutput, busyAction, idsConPdfActualizado],
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
            setEditingId(null);
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
        idOrdenVenta={editingId}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingId(null);
        }}
        onCreated={() => {
          void reload();
        }}
      />
    </>
  );
}
