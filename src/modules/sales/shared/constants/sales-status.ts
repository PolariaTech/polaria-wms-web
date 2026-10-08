import type { EstadoOrdenVenta } from "../types/sales.types";

export const ESTADO_ORDEN_VENTA_LABELS: Record<EstadoOrdenVenta, string> = {
  por_confirmar: "Por confirmar",
  confirmada: "Confirmada",
  alistamiento: "Alistamiento",
  alistada: "Alistado",
};

/** Orden de los 4 estados en filtros de UI. */
export const ESTADOS_ORDEN_VENTA: readonly EstadoOrdenVenta[] = [
  "por_confirmar",
  "confirmada",
  "alistamiento",
  "alistada",
] as const;

/** Mapea valores legados de BD/API a los 4 estados de negocio. */
const ESTADO_ORDEN_VENTA_NORMALIZE: Record<string, EstadoOrdenVenta> = {
  borrador: "por_confirmar",
  por_confirmar: "por_confirmar",
  confirmada: "confirmada",
  alistamiento: "alistamiento",
  alistada: "alistada",
  en_preparacion: "alistamiento",
  parcialmente_despachada: "alistada",
  despachada: "alistada",
  cerrada: "alistada",
  cancelada: "por_confirmar",
};

export function normalizeEstadoOrdenVenta(
  estado: string | null | undefined,
): EstadoOrdenVenta {
  if (!estado?.trim()) return "por_confirmar";
  return ESTADO_ORDEN_VENTA_NORMALIZE[estado.trim()] ?? "por_confirmar";
}

export function formatEstadoOrdenVenta(estado: string): string {
  return ESTADO_ORDEN_VENTA_LABELS[normalizeEstadoOrdenVenta(estado)];
}

export const CATALOGO_VENTA_EMPTY_MESSAGE =
  "Necesitás productos en el catálogo de la cuenta para crear ventas manuales." as const;

const ESTADOS_ORDEN_VENTA_EDITABLES: ReadonlySet<EstadoOrdenVenta> = new Set([
  "por_confirmar",
  "confirmada",
  "alistamiento",
  "alistada",
]);

export function puedeEditarOrdenVenta(estado: string): boolean {
  return ESTADOS_ORDEN_VENTA_EDITABLES.has(estado as EstadoOrdenVenta);
}

/** Variante de badge para el estado de la OV en tablas. */
export function variantEstadoOrdenVenta(
  estado: string,
): "positive" | "warning" | "neutral" {
  const normalized = estado.toLowerCase();
  if (normalized === "alistada" || normalized === "despachada" || normalized === "cerrada") {
    return "positive";
  }
  if (
    normalized === "confirmada" ||
    normalized === "alistamiento" ||
    normalized === "en_preparacion"
  ) {
    return "warning";
  }
  // por_confirmar y legacy cancelada
  return "neutral";
}
