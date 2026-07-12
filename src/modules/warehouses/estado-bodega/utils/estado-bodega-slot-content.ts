import { parseCatalogoMetadatos } from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import { formatKgEs } from "@/lib/utils/decimal-es";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** Id de paquete compartido entre líneas de la misma recepción (sin sufijo de producto). */
export function resolveIdPaquete(codigoLote: string | null | undefined): string | null {
  if (!codigoLote?.trim()) return null;

  const trimmed = codigoLote.trim();
  const recepcionMatch = trimmed.match(/^(REC-\d+)/i);
  if (recepcionMatch) {
    return recepcionMatch[1].toUpperCase();
  }

  return trimmed;
}

export function resolveProductoNombre(row: WarehouseStateRow): string | null {
  const producto = unwrapOne(row.producto);
  if (!producto) return null;

  const meta = parseCatalogoMetadatos(producto.metadatos_catalogo);
  const titulo = meta.titulo?.trim();
  const descripcion = producto.descripcion?.trim();
  const sku = producto.sku?.trim();

  if (titulo && sku) return `${sku} ${titulo}`.trim();
  if (titulo) return titulo;
  if (descripcion && sku) return `${sku} ${descripcion}`.trim();
  if (descripcion) return descripcion;
  if (sku) return sku;
  return null;
}

export function resolveClienteNombre(row: WarehouseStateRow): string | null {
  const lote = unwrapOne(row.lote);
  const cliente = unwrapOne(lote?.cliente);
  if (cliente?.nombre?.trim()) return cliente.nombre.trim();

  const proveedor = unwrapOne(lote?.proveedor);
  if (proveedor?.razon_social?.trim()) return proveedor.razon_social.trim();

  const cuenta = unwrapOne(row.cuenta);
  if (cuenta?.nombre_comercial?.trim()) return cuenta.nombre_comercial.trim();

  return null;
}

export function resolveOrdenCompraCodigo(row: WarehouseStateRow): string | null {
  const lote = unwrapOne(row.lote);
  const linea = unwrapOne(lote?.orden_compra_linea);
  const orden = unwrapOne(linea?.orden_compra);
  return orden?.codigo?.trim() || null;
}

export function formatTemperaturaSlot(
  value: string | number | null | undefined,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return null;
  return `${parsed.toLocaleString("es-CL", { maximumFractionDigits: 1 })} °C`;
}

export function formatCantidadSlot(
  value: string | number | null | undefined,
): string {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return "—";
  return `${formatKgEs(parsed)} kg`;
}

export interface EstadoBodegaSlotDetalle {
  productoNombre: string;
  idPaquete: string | null;
  cliente: string | null;
  cantidad: string;
  posicion: string | null;
  temperatura: string | null;
  ordenCompraCodigo: string | null;
}

/** Agrega el stock de una ubicación en un detalle de slot para UI/modal. */
export function buildSlotDetalleFromRows(
  rows: WarehouseStateRow[],
  posicionCodigo: string | null,
): EstadoBodegaSlotDetalle | null {
  if (rows.length === 0) return null;

  const primary = rows[0]!;
  const productoNombre =
    resolveProductoNombre(primary) ??
    (rows.length > 1 ? `${rows.length} ítems` : "Producto");

  const temperaturas = rows
    .map((row) => formatTemperaturaSlot(row.temperatura))
    .filter((value): value is string => Boolean(value));

  const totalCantidad = rows.reduce((sum, row) => {
    const parsed = Number.parseFloat(row.cantidad || "0");
    return sum + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);

  return {
    productoNombre,
    idPaquete:
      resolveOrdenCompraCodigo(primary) ??
      resolveIdPaquete(unwrapOne(primary.lote)?.codigo_lote),
    cliente: resolveClienteNombre(primary),
    cantidad: formatCantidadSlot(totalCantidad),
    posicion: posicionCodigo,
    temperatura: temperaturas[0] ?? null,
    ordenCompraCodigo: resolveOrdenCompraCodigo(primary),
  };
}
