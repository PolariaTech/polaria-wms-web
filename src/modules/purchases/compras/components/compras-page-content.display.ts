import type { OrdenCompraRow } from "../../shared/types/purchases.types";
import { ESTADO_ORDEN_LABELS } from "../../shared/constants/purchases-labels";
import { formatObservacionOrden } from "../../ordenes/utils/orden-compra-display";

export function formatEstadoOrden(estado: OrdenCompraRow["estado"]): string {
  return ESTADO_ORDEN_LABELS[estado] ?? estado;
}

export function formatObservacionesOrden(
  row: OrdenCompraRow,
  notifiedOrdenIds: ReadonlySet<string>,
): string {
  const base = formatObservacionOrden(row.observaciones);
  const notifiedNote = notifiedOrdenIds.has(row.id_orden_compra)
    ? "Proveedor notificado"
    : null;

  if (base !== "—" && notifiedNote) {
    return `${base} — ${notifiedNote}`;
  }

  return base !== "—" ? base : (notifiedNote ?? "—");
}