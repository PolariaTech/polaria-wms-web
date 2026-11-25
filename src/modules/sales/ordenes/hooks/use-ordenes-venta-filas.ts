import { useEffect, useMemo, useRef } from "react";
import { useOvFechaFiltroStore } from "@/stores/ov-fecha-filtro.store";
import type {
  EstadoOrdenVenta,
  OrdenVentaOperadorRow,
} from "../../shared/types/sales.types";
import { ordenPasaFiltroFechaEntrega } from "../components/pages/filtrar-por-fecha-entrega";
import type {
  ConteoPorEstado,
  OrdenesVentaPageData,
} from "../components/pages/ov-impresion-feedback";
import {
  mergeOvEditPresence,
  useOvEditPresencePoll,
} from "./use-ov-edit-presence-poll";

/** Cuenta cuántas OV hay en cada estado (todos los estados aparecen, aunque sea en 0). */
export function contarPorEstado(
  rows: readonly OrdenVentaOperadorRow[],
): ConteoPorEstado {
  const counts: ConteoPorEstado = {
    por_confirmar: 0,
    confirmada: 0,
    alistamiento: 0,
    alistada: 0,
    revisada: 0,
    facturada: 0,
    despachada: 0,
    cancelada: 0,
  };
  for (const row of rows) {
    counts[row.estado] = (counts[row.estado] ?? 0) + 1;
  }
  return counts;
}

/** Filas del listado con presencia de edición, filtro por día de entrega y por estado. */
export function useOrdenesVentaFilas({
  data,
  codigoCuenta,
  inspect,
  zonaHoraria,
  estadoFiltro,
}: {
  data: OrdenesVentaPageData | null | undefined;
  codigoCuenta: string | null;
  inspect: boolean;
  zonaHoraria: string;
  estadoFiltro: EstadoOrdenVenta | null;
}) {
  const fechaFiltroDia = useOvFechaFiltroStore((s) => s.dia);
  const rowsBase = useMemo(() => data?.rows ?? [], [data?.rows]);
  const presenceById = useOvEditPresencePoll({
    codigoCuenta,
    ids: rowsBase.map((row) => row.idOrdenVenta),
    enabled: Boolean(codigoCuenta) && !inspect,
  });
  const rows = useMemo(
    () => mergeOvEditPresence(rowsBase, presenceById),
    [rowsBase, presenceById],
  );
  const rowsDelDia = useMemo(() => {
    if (!fechaFiltroDia) return rows;
    return rows.filter((row) =>
      ordenPasaFiltroFechaEntrega(row.fechaEntrega, fechaFiltroDia, zonaHoraria),
    );
  }, [fechaFiltroDia, rows, zonaHoraria]);
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!estadoFiltro) return rowsDelDia;
    return rowsDelDia.filter((row) => row.estado === estadoFiltro);
  }, [rowsDelDia, estadoFiltro]);

  const countsByEstado = useMemo(() => contarPorEstado(rowsDelDia), [rowsDelDia]);

  return { rows, rowsDelDia, filteredRows, countsByEstado, fechaFiltroDia, rowsRef };
}
