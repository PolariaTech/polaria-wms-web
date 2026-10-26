import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { parseCatalogoMetadatos } from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaLineaRow,
} from "../../shared/types/sales.types";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "../../shared/types/sales.types";

type LineaConProducto = {
  producto?: OrdenVentaLineaRow["producto"] | null;
};

type LineaConUnidad = {
  unidad_medida?: string | null;
};

export function resolveOrdenVentaLineaTitulo(linea: LineaConProducto): string {
  const producto = linea.producto;
  if (!producto) {
    return "Sin título";
  }

  const meta = parseCatalogoMetadatos(producto.metadatos_catalogo);
  return (
    meta.titulo?.trim() ||
    producto.descripcion?.trim() ||
    producto.sku?.trim() ||
    "Sin título"
  );
}

/** REQ-147: unidad de la línea; fallback kg solo si no hay dato. */
export function resolveOrdenVentaLineaUnidad(linea: LineaConUnidad): string {
  return linea.unidad_medida?.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT;
}

export function formatOrdenVentaCantidadConUnidad(
  cantidad: number,
  unidad: string,
): string {
  const u = unidad.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT;
  return `${formatKgEs(cantidad)} ${u}`;
}

/** Misma unidad en todas las líneas, o null si son mixtas / vacías. */
export function resolveUnidadComunLineas(
  lineas: readonly LineaConUnidad[],
): string | null {
  if (lineas.length === 0) return null;
  const first = resolveOrdenVentaLineaUnidad(lineas[0]!);
  for (let i = 1; i < lineas.length; i += 1) {
    if (resolveOrdenVentaLineaUnidad(lineas[i]!) !== first) return null;
  }
  return first;
}

export function formatOrdenVentaLineaTotal(linea: OrdenVentaLineaRow): number {
  return linea.cantidad_pedida * linea.precio_unitario;
}

export function sumOrdenVentaCantidadKg(orden: OrdenVentaDetalleRow): number {
  return (orden.lineas ?? []).reduce(
    (sum, linea) => sum + linea.cantidad_pedida,
    0,
  );
}

export function sumOrdenVentaTotal(orden: OrdenVentaDetalleRow): number {
  return (orden.lineas ?? []).reduce(
    (sum, linea) => sum + formatOrdenVentaLineaTotal(linea),
    0,
  );
}

export function formatOrdenVentaCantidades(orden: OrdenVentaDetalleRow): string {
  const lineas = orden.lineas ?? [];
  const total = sumOrdenVentaCantidadKg(orden);
  if (total <= 0) {
    return "—";
  }

  const unidad =
    resolveUnidadComunLineas(lineas) ?? UNIDAD_MEDIDA_VENTA_DEFAULT;
  return formatOrdenVentaCantidadConUnidad(total, unidad);
}

export function formatOrdenVentaTotal(orden: OrdenVentaDetalleRow): string {
  return `$${formatPrecioEs(sumOrdenVentaTotal(orden))}`;
}

export function formatCompradorOrdenVenta(orden: OrdenVentaDetalleRow): string {
  return formatCompradorNombreOrdenVenta(orden);
}

/** Solo el nombre del comprador (para PDF de almacén / QR). */
export function formatCompradorNombreOrdenVenta(
  orden: OrdenVentaDetalleRow,
): string {
  return orden.comprador_nombre?.trim() || orden.comprador_codigo?.trim() || "—";
}

export function formatObservacionOrdenVenta(
  observaciones: string | null | undefined,
): string {
  const trimmed = observaciones?.trim();
  return trimmed || "—";
}
