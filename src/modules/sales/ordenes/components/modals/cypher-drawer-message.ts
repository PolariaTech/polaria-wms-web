import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import {
  looksLikeCorreoCuerpoEnNotas,
  prepareCorreoBodyForCypherDisplay,
} from "../../utils/origen/texto-origen-pedido";

/** Texto crudo del correo (completo) para el modal. */
export function resolveCuerpoMensajeCompleto(orden: OrdenVentaDetalleRow): string {
  const fromOrigen = orden.origen_texto?.trim() || "";
  if (fromOrigen) return fromOrigen;
  const obsRaw = (orden.observaciones ?? "").trim();
  if (!obsRaw) return "";
  if (looksLikeCorreoCuerpoEnNotas(obsRaw) || obsRaw.length > 180) {
    return obsRaw;
  }
  return "";
}

/** Vista compacta en el cypher (sin reply/legal duplicados). */
export function resolveCuerpoMensajePreview(orden: OrdenVentaDetalleRow): string {
  const full = resolveCuerpoMensajeCompleto(orden);
  if (!full) return "";
  return prepareCorreoBodyForCypherDisplay(full);
}
