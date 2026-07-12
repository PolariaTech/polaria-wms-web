import type { EstadoOrdenVenta } from "../types/sales.types";

export const ESTADO_ORDEN_VENTA_LABELS: Record<EstadoOrdenVenta, string> = {
  borrador: "Borrador",
  confirmada: "Confirmada",
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

export const CATALOGO_VENTA_SIN_STOCK_MESSAGE =
  "No hay productos con kilos disponibles en stock para vender." as const;
