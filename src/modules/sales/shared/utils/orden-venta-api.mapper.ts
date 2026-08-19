import type {
  EstadoOrdenVenta,
  OrdenVentaOperadorRow,
} from "../types/sales.types";

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
  const estado = readString(raw, "estado") as EstadoOrdenVenta | null;

  return {
    idOrdenVenta:
      readString(raw, "idOrdenVenta", "id_orden_venta") ?? "",
    venta: readString(raw, "venta", "codigo") ?? "—",
    cuenta: readString(raw, "cuenta", "codigoCuenta", "codigo_cuenta") ?? "—",
    comprador: readString(raw, "comprador", "compradorNombre") ?? "—",
    productos: readString(raw, "productos") ?? "—",
    cantidadKg: readNumber(raw, "cantidadKg", "cantidad_kg"),
    total: readNumber(raw, "total"),
    estado: estado ?? "borrador",
    fecha:
      readString(raw, "fecha", "fechaPedido", "fecha_pedido", "createdAt", "created_at") ??
      "",
    destino: readString(raw, "destino", "bodegaDestinoNombre") ?? "—",
  };
}
