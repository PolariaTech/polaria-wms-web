import { normalizeEstadoOrdenVenta } from "../../shared/constants/sales-status";
import type { OrdenVentaRealtimePostgresPayload } from "../../shared/hooks/ordenes-venta-realtime.types";
import type { OrdenVentaRealtimePatchEvent } from "./apply-ordenes-venta-realtime-patch";

export type OrdenVentaRealtimeResolveResult =
  | { kind: "ignore" }
  | { kind: "reload" }
  | { kind: "patch"; event: OrdenVentaRealtimePatchEvent }
  | { kind: "fetch"; idOrdenVenta: string };

function readIdOrdenVenta(
  payload: OrdenVentaRealtimePostgresPayload,
): string | null {
  const fromNew = payload.new.id_orden_venta;
  const fromOld = payload.old.id_orden_venta;
  const raw =
    (typeof fromNew === "string" && fromNew) ||
    (typeof fromOld === "string" && fromOld) ||
    null;
  return raw?.trim() || null;
}

function readCodigoCuenta(
  record: Record<string, unknown>,
): string | null {
  const raw = record.codigo_cuenta;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/** Traduce un evento Realtime a patch local, fetch puntual o recarga completa. */
export function resolveOrdenVentaRealtimeAction(
  payload: OrdenVentaRealtimePostgresPayload,
  codigoCuenta: string,
): OrdenVentaRealtimeResolveResult {
  if (payload.table === "orden_venta_linea") {
    return { kind: "reload" };
  }

  const cuentaEvento =
    readCodigoCuenta(payload.new) ?? readCodigoCuenta(payload.old);
  if (cuentaEvento && cuentaEvento !== codigoCuenta) {
    return { kind: "ignore" };
  }

  if (payload.eventType === "DELETE") {
    const id = readIdOrdenVenta(payload);
    if (!id) return { kind: "reload" };
    return { kind: "patch", event: { type: "remove", idOrdenVenta: id } };
  }

  const estadoRaw = payload.new.estado;
  const estado =
    typeof estadoRaw === "string"
      ? normalizeEstadoOrdenVenta(estadoRaw)
      : null;
  const id = readIdOrdenVenta(payload);

  if (estado === "cancelada") {
    if (!id) return { kind: "reload" };
    return { kind: "patch", event: { type: "remove", idOrdenVenta: id } };
  }

  if (!id) return { kind: "reload" };
  return { kind: "fetch", idOrdenVenta: id };
}