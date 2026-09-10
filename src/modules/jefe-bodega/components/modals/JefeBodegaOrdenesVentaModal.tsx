"use client";

import { Download, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { PolariaTableBadge } from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { cn } from "@/lib/utils/cn";
import {
  formatEstadoOrdenVenta,
  getOrdenVentaDetalle,
  listOrdenesVentaOperadorParaJefe,
  type OrdenVentaOperadorRow,
} from "@/modules/sales";
import { downloadOrdenTareaAlmacenPdf } from "@/modules/sales/ordenes/print/download-orden-tarea-almacen-pdf";
import { mapOrdenVentaToAlmacenPrintData } from "@/modules/sales/ordenes/print/map-orden-tarea-almacen";
import { useOrdenesVentaSubscription } from "@/modules/sales/shared/hooks/useOrdenesVentaSubscription";

interface JefeBodegaOrdenesVentaModalProps {
  open: boolean;
  onClose: () => void;
  codigoCuenta: string | null;
  idBodega?: string | null;
}

const ESTADOS_VISIBLE = new Set(["confirmada", "en_preparacion"]);

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
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

export function JefeBodegaOrdenesVentaModal({
  open,
  onClose,
  codigoCuenta,
  idBodega = null,
}: JefeBodegaOrdenesVentaModalProps) {
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const downloadLockRef = useRef(false);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrdenes = useCallback(async () => {
    if (!codigoCuenta?.trim() || !idBodega?.trim()) return [];
    const rows = await listOrdenesVentaOperadorParaJefe({
      codigoCuenta,
      idBodega,
    });
    return rows.filter((row) =>
      ESTADOS_VISIBLE.has(row.estado.toLowerCase()),
    );
  }, [codigoCuenta, idBodega]);

  const { data, isLoading, error, reload } = useAsyncQuery(
    fetchOrdenes,
    open && Boolean(codigoCuenta) && Boolean(idBodega),
  );

  const reloadRealtime = useCallback(() => {
    if (!open) return;
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      void reload();
    }, 250);
  }, [open, reload]);

  useOrdenesVentaSubscription(
    open ? codigoCuenta : null,
    reloadRealtime,
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setBusyId(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, []);

  const ordenes = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return ordenes;
    return ordenes.filter((row) => {
      const haystack =
        `${row.venta} ${row.comprador} ${row.productos} ${row.estado} ${row.destino}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [ordenes, query]);

  const handleDownload = useCallback(
    async (row: OrdenVentaOperadorRow) => {
      if (!codigoCuenta || downloadLockRef.current) return;
      downloadLockRef.current = true;
      setBusyId(row.idOrdenVenta);

      try {
        let detalle = null;
        try {
          detalle = await getOrdenVentaDetalle({
            codigoCuenta,
            idOrdenVenta: row.idOrdenVenta,
          });
        } catch {
          detalle = null;
        }

        const printData = mapOrdenVentaToAlmacenPrintData({
          listRow: row,
          detalle,
        });
        await downloadOrdenTareaAlmacenPdf(printData);
      } finally {
        downloadLockRef.current = false;
        setBusyId(null);
      }
    },
    [codigoCuenta],
  );

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <PolariaFormModal
      open={open}
      onClose={handleClose}
      title="Órdenes de venta"
      description="Confirmadas · últimos 7 días · PDF para almacén"
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="lg"
      error={
        error ??
        (!codigoCuenta && open
          ? "No se encontró la cuenta activa."
          : !idBodega && open
            ? "No se encontró la bodega activa."
            : null)
      }
    >
      {ordenes.length > 5 ? (
        <div className="relative mb-2.5">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-polaria-w-50"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar venta o cliente"
            aria-label="Buscar orden de venta"
            className={cn(
              "w-full rounded-lg border border-polaria-w-08 bg-polaria-w-08 py-2 pl-9 pr-3",
              "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
              "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
            )}
          />
        </div>
      ) : null}

      {isLoading ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          Cargando órdenes…
        </p>
      ) : filtered.length === 0 ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          {ordenes.length === 0
            ? "No hay órdenes de venta en esta bodega (últimos 7 días)."
            : "Ninguna orden coincide con la búsqueda."}
        </p>
      ) : (
        <ul className="max-h-[min(22rem,50vh)] overflow-y-auto rounded-lg border border-polaria-w-08">
          {filtered.map((row, index) => {
            const busy = busyId === row.idOrdenVenta;
            return (
              <li
                key={row.idOrdenVenta}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5",
                  index > 0 && "border-t border-polaria-w-08",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-polaria-teal polaria-text-body-sm">
                      {row.venta}
                    </span>
                    {renderEstadoBadge(row.estado)}
                  </div>
                  <p className="mt-0.5 truncate polaria-text-body-sm text-polaria-w">
                    {row.comprador}
                  </p>
                  <p className="mt-0.5 truncate polaria-text-caption text-polaria-w-50">
                    {row.productos} · {formatKgEs(row.cantidadKg)} kg ·{" "}
                    {formatDateTime(row.fecha)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void handleDownload(row);
                  }}
                  disabled={busy}
                  aria-label={`Descargar PDF ${row.venta}`}
                  title="Descargar PDF"
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-polaria-t-20 text-polaria-teal",
                    "transition hover:bg-polaria-t-08",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                  )}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PolariaFormModal>
  );
}
