import { normalizeEstadoOrdenVenta } from "../constants/sales-status";
import type { OrdenVentaOperadorRow } from "../types/sales.types";

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
    fecha:
      readString(raw, "fecha", "createdAt", "created_at", "fechaPedido", "fecha_pedido") ??
      "",
    ordenesTrabajo: Math.max(
      1,
      Math.trunc(readNumber(raw, "ordenesTrabajo", "ordenes_trabajo")),
    ),
    destino: readString(raw, "destino", "bodegaDestinoNombre") ?? "—",
    idBodega: readString(raw, "idBodega", "id_bodega") ?? "",
    idBodegaDestino: readString(raw, "idBodegaDestino", "id_bodega_destino"),
  };
}
