"use client";

import { useEffect, useState } from "react";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import { fetchOrdenVentaLog } from "../../services/orden-venta-log.client";
import type { OrdenVentaLogEntry } from "../../types/orden-venta-log.types";
import { filterLogEntriesVisible } from "../../utils/ot/filter-log-entries-visible";

interface UseCypherDrawerLogArgs {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  idOrdenTrabajoBitacora: string | null;
  orden: OrdenVentaDetalleRow | null;
  row: OrdenVentaOperadorRow | null;
  logNonce: number;
}

export function useCypherDrawerLog({
  idOrdenVenta,
  codigoCuenta,
  idOrdenTrabajoBitacora,
  orden,
  row,
  logNonce,
}: UseCypherDrawerLogArgs) {
  const [logEntries, setLogEntries] = useState<OrdenVentaLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    if (!idOrdenVenta || !codigoCuenta) {
      setLogEntries([]);
      return;
    }

    let cancelled = false;
    setLogLoading(true);
    void fetchOrdenVentaLog({
      idOrdenVenta,
      codigoCuenta,
      idOrdenTrabajo: idOrdenTrabajoBitacora,
      createdAt: orden?.created_at || orden?.fecha_pedido || row?.fecha,
      autor: orden?.vendedor ?? null,
    })
      .then((rows) => {
        if (!cancelled) setLogEntries(filterLogEntriesVisible(rows));
      })
      .catch(() => {
        if (!cancelled) setLogEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    codigoCuenta,
    idOrdenTrabajoBitacora,
    idOrdenVenta,
    orden?.created_at,
    orden?.fecha_pedido,
    orden?.vendedor,
    row?.fecha,
    logNonce,
  ]);

  return { logEntries, setLogEntries, logLoading, setLogLoading };
}
