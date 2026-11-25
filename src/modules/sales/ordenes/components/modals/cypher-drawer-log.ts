"use client";

import { useEffect, useState } from "react";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import { fetchOrdenVentaLog } from "../../services/orden-venta-log.client";
import type { OrdenVentaLogEntry } from "../../types/orden-venta-log.types";
import { filterLogEntriesVisible } from "../../utils/ot/filter-log-entries-visible";
import { buildCypherLogQuery } from "./cypher-drawer-log-query";

const INTERVALO_BITACORA_MS = 3000;

interface UseCypherDrawerLogArgs {
  idOrdenVenta: string | null;
  codigoCuenta: string | null;
  idOrdenTrabajoBitacora: string | null;
  orden: OrdenVentaDetalleRow | null;
  row: OrdenVentaOperadorRow | null;
  logNonce: number;
}

function consultarBitacora(
  consulta: ReturnType<typeof buildCypherLogQuery>,
  mostrarCarga: boolean,
  sigueVigente: () => boolean,
  setLogEntries: (valor: OrdenVentaLogEntry[]) => void,
  setLogLoading: (valor: boolean) => void,
) {
  if (mostrarCarga) setLogLoading(true);
  void fetchOrdenVentaLog(consulta)
    .then((filas) => {
      if (!sigueVigente()) return;
      setLogEntries(filterLogEntriesVisible(filas));
    })
    .catch(() => {
      if (!sigueVigente() || !mostrarCarga) return;
      setLogEntries([]);
    })
    .finally(() => {
      if (sigueVigente() && mostrarCarga) setLogLoading(false);
    });
}

function vigilarBitacora(leer: () => void): () => void {
  const alVisible = () => {
    if (document.visibilityState === "visible") leer();
  };
  const reloj = window.setInterval(leer, INTERVALO_BITACORA_MS);
  window.addEventListener("focus", alVisible);
  window.addEventListener("pageshow", alVisible);
  document.addEventListener("visibilitychange", alVisible);
  return () => {
    window.clearInterval(reloj);
    window.removeEventListener("focus", alVisible);
    window.removeEventListener("pageshow", alVisible);
    document.removeEventListener("visibilitychange", alVisible);
  };
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

    let vigente = true;
    const consulta = buildCypherLogQuery({
      idOrdenVenta,
      codigoCuenta,
      idOrdenTrabajo: idOrdenTrabajoBitacora,
      createdAt: orden?.created_at || orden?.fecha_pedido || row?.fecha,
    });
    const leer = (mostrarCarga: boolean) =>
      consultarBitacora(consulta, mostrarCarga, () => vigente, setLogEntries, setLogLoading);

    leer(true);
    const dejarDeVigilar = vigilarBitacora(() => leer(false));
    return () => {
      vigente = false;
      dejarDeVigilar();
    };
  }, [
    codigoCuenta,
    idOrdenTrabajoBitacora,
    idOrdenVenta,
    orden?.created_at,
    orden?.fecha_pedido,
    row?.fecha,
    logNonce,
  ]);

  return { logEntries, setLogEntries, logLoading, setLogLoading };
}
