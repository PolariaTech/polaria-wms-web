import type { EstadoOrdenVenta } from "../types/sales.types";

export const ESTADO_ORDEN_VENTA_LABELS: Record<EstadoOrdenVenta, string> = {
  borrador: "Borrador",
  confirmada: "Confirmada",
  alistamiento: "Alistamiento",
  alistada: "Alistada",
  en_preparacion: "En preparación",
  parcialmente_despachada: "Parc. despachada",
  despachada: "Despachada",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
};

export function formatEstadoOrdenVenta(estado: string): string {
  return ESTADO_ORDEN_VENTA_LABELS[estado as EstadoOrdenVenta] ?? estado;
}

export const CATALOGO_VENTA_EMPTY_MESSAGE =
  "Necesitás productos en el catálogo de la cuenta para crear ventas manuales." as const;

const ESTADOS_ORDEN_VENTA_EDITABLES: ReadonlySet<EstadoOrdenVenta> = new Set([
  "borrador",
  "confirmada",
  "alistamiento",
  "alistada",
  "en_preparacion",
]);

export function puedeEditarOrdenVenta(estado: string): boolean {
  return ESTADOS_ORDEN_VENTA_EDITABLES.has(estado as EstadoOrdenVenta);
}

/** Variante de badge para el estado de la OV en tablas. */
export function variantEstadoOrdenVenta(
  estado: string,
): "positive" | "warning" | "neutral" {
  const normalized = estado.toLowerCase();
  if (
    normalized === "despachada" ||
    normalized === "cerrada" ||
    normalized === "alistada"
  ) {
    return "positive";
  }
  if (normalized === "cancelada") {
    return "neutral";
  }
  if (
    normalized === "confirmada" ||
    normalized === "alistamiento" ||
    normalized === "en_preparacion"
  ) {
    return "warning";
  }
  return "neutral";
}
