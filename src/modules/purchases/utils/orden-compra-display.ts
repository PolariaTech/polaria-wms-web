import { formatKgEs } from "@/lib/decimal-es";
import { parseCatalogoMetadatos } from "@/modules/admin-panel/constants/catalogo-producto";
import type {
  OrdenCompraLineaRow,
  OrdenCompraRow,
} from "../types/purchases.types";

export function resolveOrdenLineaTitulo(linea: OrdenCompraLineaRow): string {
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

export function nombresProductosOrden(orden: OrdenCompraRow): string {
  const names = (orden.lineas ?? [])
    .map((linea) => resolveOrdenLineaTitulo(linea))
    .filter(Boolean);

  return names.length ? names.join(" · ") : "—";
}

export function formatFechaOrden(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatObservacionOrden(
  observaciones: string | null | undefined,
): string {
  const trimmed = observaciones?.trim();
  return trimmed || "—";
}

export function formatCantidadesOrden(orden: OrdenCompraRow): string {
  const items = orden.lineas ?? [];
  if (!items.length) {
    return "—";
  }

  return items
    .map((linea) => `${formatKgEs(Number(linea.cantidad))} kg`)
    .join(" · ");
}
