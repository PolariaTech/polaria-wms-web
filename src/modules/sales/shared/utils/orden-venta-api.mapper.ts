import { normalizeEstadoOrdenVenta } from "../constants/sales-status";
import type { OrdenVentaOperadorRow } from "../types/sales.types";
import {
  computeOvSla,
  normalizeOvSlaConfig,
} from "./ov-sla";

function readString(
  row: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function readNumber(
  row: Record<string, unknown>,
  ...keys: string[]
): number {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

export function mapOrdenVentaOperadorApiRow(
  raw: Record<string, unknown>,
): OrdenVentaOperadorRow {
  const estado = normalizeEstadoOrdenVenta(readString(raw, "estado"));

  const occTodasRaw = raw.occTodas ?? raw.occ_todas;
  const occTodas = Array.isArray(occTodasRaw)
    ? occTodasRaw
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];
  const occ =
    readString(raw, "occ", "ordenCompraHotel", "orden_compra_hotel") ??
    occTodas[0] ??
    "—";

  const fecha =
    readString(raw, "fecha", "createdAt", "created_at", "fechaPedido", "fecha_pedido") ??
    "";
  const estadoDesde =
    readString(raw, "estadoDesde", "estado_desde", "updatedAt", "updated_at") ??
    fecha;
  const slaConfig = normalizeOvSlaConfig(
    readNumber(raw, "ovSlaMinutos", "ov_sla_minutos") || null,
    readNumber(raw, "ovAlertaMinutos", "ov_alerta_minutos") || null,
  );
  const apiSla = readString(raw, "slaStatus", "sla_status");
  const apiAlerta = readString(raw, "alertaStatus", "alerta_status");
  const computed = computeOvSla(estado, estadoDesde, slaConfig);

  return {
    idOrdenVenta:
      readString(raw, "idOrdenVenta", "id_orden_venta") ?? "",
    venta: readString(raw, "venta", "codigo") ?? "—",
    occ,
    occTodas: occTodas.length > 0 ? occTodas : occ !== "—" ? [occ] : [],
    cuenta: readString(raw, "cuenta", "codigoCuenta", "codigo_cuenta") ?? "—",
    comprador: readString(raw, "comprador", "compradorNombre") ?? "—",
    productos: readString(raw, "productos") ?? "—",
    cantidadKg: readNumber(raw, "cantidadKg", "cantidad_kg"),
    total: readNumber(raw, "total"),
    estado,
    fecha,
    ordenesTrabajo: Math.max(
      1,
      Math.trunc(readNumber(raw, "ordenesTrabajo", "ordenes_trabajo")),
    ),
    destino: readString(raw, "destino", "bodegaDestinoNombre") ?? "—",
    idBodega: readString(raw, "idBodega", "id_bodega") ?? "",
    idBodegaDestino: readString(raw, "idBodegaDestino", "id_bodega_destino"),
    slaStatus:
      apiSla === "en_tiempo" || apiSla === "atrasada" || apiSla === "cerrada"
        ? apiSla
        : computed.slaStatus,
    alertaStatus:
      apiAlerta === "ok" ||
      apiAlerta === "en_riesgo" ||
      apiAlerta === "atrasada" ||
      apiAlerta === "cerrada"
        ? apiAlerta
        : computed.alertaStatus,
    minutosEnEstado: Math.max(
      0,
      Math.trunc(
        readNumber(raw, "minutosEnEstado", "minutos_en_estado") ||
          computed.minutosEnEstado,
      ),
    ),
  };
}
