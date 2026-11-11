"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import { idsOvYaImpresas } from "./ya-impresas";

type EjecutarEnCuenta = <T>(tarea: () => Promise<T>) => Promise<T>;

interface Entrada {
  codigoCuenta: string | null | undefined;
  rows: readonly OrdenVentaOperadorRow[];
  runScoped: EjecutarEnCuenta;
  /** Solo se lee el registro de impresiones cuando hace falta: leerlo cuesta una petición por orden. */
  activo: boolean;
}

/**
 * Qué órdenes de venta ya se imprimieron alguna vez (por su registro), para el filtro de reimpresión
 * de la detallada. `ids` es `null` hasta que se lee; `recargar` lo descarta para volver a leerlo
 * (por ejemplo, justo después de imprimir).
 */
export function useYaImpresas({ codigoCuenta, rows, runScoped, activo }: Entrada) {
  const [leido, setLeido] = useState<{ rows: readonly OrdenVentaOperadorRow[]; ids: ReadonlySet<string> } | null>(null);
  const [progreso, setProgreso] = useState<string | null>(null);
  const runScopedActual = useRef(runScoped);
  useEffect(() => {
    runScopedActual.current = runScoped;
  });

  const ids = leido !== null && leido.rows === rows ? leido.ids : null;
  const buscando = activo && rows.length > 0 && ids === null;

  useEffect(() => {
    if (!buscando || !codigoCuenta) return;
    let cancelado = false;
    void idsOvYaImpresas({
      codigoCuenta,
      rows,
      runScoped: (tarea) => runScopedActual.current(tarea),
      onProgreso: (leidas, total) => {
        if (!cancelado) setProgreso(`Revisando OV ${leidas} de ${total}…`);
      },
    }).then((ids) => {
      if (cancelado) return;
      setLeido({ rows, ids });
      setProgreso(null);
    });
    return () => {
      cancelado = true;
    };
  }, [buscando, codigoCuenta, rows]);

  const recargar = useCallback(() => setLeido(null), []);

  return { ids, buscando, progreso, recargar };
}
