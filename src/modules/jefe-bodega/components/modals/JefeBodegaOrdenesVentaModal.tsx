"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import {
  PolariaTableBadge,
  PolariaTableCode,
  PolariaTableDownloadButton,
} from "@/components/shared/table/PolariaTableCells";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { cn } from "@/lib/utils/cn";
import {
  formatEstadoOrdenVenta,
  getOrdenVentaDetalle,
  listOrdenesVentaOperador,
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
    if (!codigoCuenta) return [];
    const rows = await listOrdenesVentaOperador({
      codigoCuenta,
      idBodega: idBodega ?? undefined,
    });
    return rows.filter((row) => row.estado.toLowerCase() === "confirmada");
  }, [codigoCuenta, idBodega]);

  const { data, isLoading, error, reload } = useAsyncQuery(
    fetchOrdenes,
    open && Boolean(codigoCuenta),
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
        `${row.venta} ${row.comprador} ${row.productos} ${row.estado}`.toLowerCase();
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
      description="Órdenes confirmadas de los últimos 7 días. Descargá una copia para almacén."
      onSubmit={(event) => event.preventDefault()}
      asForm={false}
      hideHeaderClose
      footerAction={<></>}
      cancelLabel="Cerrar"
      compact
      size="xl"
      error={
        error ??
        (!codigoCuenta && open ? "No se encontró la cuenta activa." : null)
      }
    >
      {ordenes.length > 4 ? (
        <div className="relative mb-3">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-polaria-w-50"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por venta, comprador o producto"
            aria-label="Buscar orden de venta"
            className={cn(
              "w-full rounded-xl border border-polaria-w-08 bg-polaria-w-08 py-2.5 pl-10 pr-4",
              "polaria-text-body-sm text-polaria-w placeholder:text-polaria-w-20 outline-none",
              "focus:border-polaria-t-20 focus:ring-1 focus:ring-polaria-t-20",
            )}
          />
        </div>
      ) : null}

      {isLoading ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          Cargando órdenes de venta…
        </p>
      ) : filtered.length === 0 ? (
        <p className="polaria-text-body-sm text-polaria-w-50">
          {ordenes.length === 0
            ? "No hay órdenes de venta confirmadas en los últimos 7 días."
            : "Ninguna orden coincide con la búsqueda."}
        </p>
      ) : (
        <ul className="flex max-h-[min(28rem,55vh)] flex-col gap-2 overflow-y-auto pr-1">
          {filtered.map((row) => (
            <li
              key={row.idOrdenVenta}
              className="flex items-center gap-3 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <PolariaTableCode>{row.venta}</PolariaTableCode>
                  {renderEstadoBadge(row.estado)}
                </div>
                <p className="mt-1 truncate polaria-text-body-sm text-polaria-w">
                  {row.comprador}
                </p>
                <p className="mt-0.5 truncate polaria-text-caption text-polaria-w-50">
                  {row.productos} · {formatKgEs(row.cantidadKg)} kg ·{" "}
                  {formatDateTime(row.fecha)}
                </p>
              </div>
              <PolariaTableDownloadButton
                onClick={() => {
                  void handleDownload(row);
                }}
                disabled={busyId === row.idOrdenVenta}
                label={`Descargar ${row.venta}`}
              />
            </li>
          ))}
        </ul>
      )}
    </PolariaFormModal>
  );
}
