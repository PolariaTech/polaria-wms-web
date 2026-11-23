import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";

export type OrdenVentaRealtimePatchEvent =
  | { type: "remove"; idOrdenVenta: string }
  | { type: "upsert"; row: OrdenVentaOperadorRow };

function sortOperadorRowsPorCreacionDesc(
  rows: OrdenVentaOperadorRow[],
): OrdenVentaOperadorRow[] {
  return [...rows].sort((a, b) => {
    const ta = Date.parse(a.fecha) || 0;
    const tb = Date.parse(b.fecha) || 0;
    if (tb !== ta) return tb - ta;
    return b.idOrdenVenta.localeCompare(a.idOrdenVenta);
  });
}

/** Fusiona un cambio puntual de OV en el snapshot local del listado operador. */
export function applyOrdenVentaRealtimePatch(
  rows: OrdenVentaOperadorRow[],
  event: OrdenVentaRealtimePatchEvent,
): OrdenVentaOperadorRow[] {
  if (event.type === "remove") {
    return rows.filter((row) => row.idOrdenVenta !== event.idOrdenVenta);
  }

  const sinDuplicado = rows.filter(
    (row) => row.idOrdenVenta !== event.row.idOrdenVenta,
  );
  return sortOperadorRowsPorCreacionDesc([...sinDuplicado, event.row]);
}