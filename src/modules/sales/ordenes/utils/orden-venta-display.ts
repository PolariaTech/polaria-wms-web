import { formatKgEs, formatPrecioEs } from "@/lib/utils/decimal-es";
import { parseCatalogoMetadatos } from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import type {
  OrdenVentaDetalleRow,
  OrdenVentaLineaRow,
} from "../../shared/types/sales.types";

export function resolveOrdenVentaLineaTitulo(linea: OrdenVentaLineaRow): string {
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
  const totalKg = sumOrdenVentaCantidadKg(orden);
  if (totalKg <= 0) {
    return "—";
  }

  return `${formatKgEs(totalKg)} kg`;
}

export function formatOrdenVentaTotal(orden: OrdenVentaDetalleRow): string {
  return `$${formatPrecioEs(sumOrdenVentaTotal(orden))}`;
}

export function formatCompradorOrdenVenta(orden: OrdenVentaDetalleRow): string {
  const nombre = orden.comprador_nombre?.trim();
  const codigo = orden.comprador_codigo?.trim();

  if (nombre && codigo) {
    return `${codigo} — ${nombre}`;
  }

  return nombre || codigo || "—";
}

export function formatObservacionOrdenVenta(
  observaciones: string | null | undefined,
): string {
  const trimmed = observaciones?.trim();
  return trimmed || "—";
}
