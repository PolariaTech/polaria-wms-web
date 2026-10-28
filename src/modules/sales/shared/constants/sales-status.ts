import type { EstadoOrdenVenta } from "../types/sales.types";

export const ESTADO_ORDEN_VENTA_LABELS: Record<EstadoOrdenVenta, string> = {
  por_confirmar: "Por confirmar",
  confirmada: "Confirmada",
  alistamiento: "Alistamiento",
  alistada: "Alistado",
  revisada: "Revisado",
  despachada: "Despachado",
  facturada: "Facturado",
  cancelada: "Borrada",
};

/** Orden de los estados operativos en filtros de UI (sin cancelada). */
export const ESTADOS_ORDEN_VENTA: readonly EstadoOrdenVenta[] = [
  "por_confirmar",
  "confirmada",
  "alistamiento",
  "alistada",
  "revisada",
  "despachada",
  "facturada",
] as const;

/** Estados a los que se puede avanzar a mano desde Cypher. */
const ESTADOS_AVANCE_MANUAL: readonly EstadoOrdenVenta[] = [
  "alistamiento",
  "alistada",
  "revisada",
  "despachada",
  "facturada",
];

/** Botones de Cambio de estado: solo hitos posteriores al actual. */
export function estadosSuperioresOrdenVenta(
  estado: string,
): readonly EstadoOrdenVenta[] {
  const actual = normalizeEstadoOrdenVenta(estado);
  const index = ESTADOS_AVANCE_MANUAL.indexOf(actual);
  if (index >= 0) return ESTADOS_AVANCE_MANUAL.slice(index + 1);
  if (actual === "por_confirmar" || actual === "confirmada") {
    return ESTADOS_AVANCE_MANUAL;
  }
  return [];
}

export function puedeAvanzarEstadoOrdenVenta(
  actual: string,
  destino: string,
): boolean {
  const next = normalizeEstadoOrdenVenta(destino);
  return estadosSuperioresOrdenVenta(actual).includes(next);
}

/** Mapea valores legados de BD/API a estados de negocio. */
const ESTADO_ORDEN_VENTA_NORMALIZE: Record<string, EstadoOrdenVenta> = {
  borrador: "por_confirmar",
  por_confirmar: "por_confirmar",
  confirmada: "confirmada",
  alistamiento: "alistamiento",
  alistada: "alistada",
  revisada: "revisada",
  facturada: "facturada",
  facturado: "facturada",
  en_preparacion: "alistamiento",
  parcialmente_despachada: "alistada",
  despachada: "despachada",
  embarcada: "despachada",
  cerrada: "despachada",
  cancelada: "cancelada",
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
  "revisada",
]);

export function puedeEditarOrdenVenta(estado: string): boolean {
  return ESTADOS_ORDEN_VENTA_EDITABLES.has(estado as EstadoOrdenVenta);
}

/**
 * Botón Editar en la lista de OV: solo en Confirmada.
 * Por confirmar se revisa/emite con clic en la fila (flujo Mateo).
 */
export function puedeEditarOrdenVentaDesdeLista(estado: string): boolean {
  return normalizeEstadoOrdenVenta(estado) === "confirmada";
}

/**
 * Soft-delete («Borrar» en UI): solo OV por confirmar (p. ej. duplicados).
 */
export function puedeBorrarOrdenVenta(estado: string): boolean {
  return normalizeEstadoOrdenVenta(estado) === "por_confirmar";
}

/** Imprimir / PDF / fotos: solo desde confirmada en adelante. */
const ESTADOS_ORDEN_VENTA_ACCIONES_ALMACEN: ReadonlySet<EstadoOrdenVenta> =
  new Set([
    "confirmada",
    "alistamiento",
    "alistada",
    "revisada",
    "facturada",
    "despachada",
  ]);

export function puedeAccionesAlmacenOrdenVenta(estado: string): boolean {
  return ESTADOS_ORDEN_VENTA_ACCIONES_ALMACEN.has(
    normalizeEstadoOrdenVenta(estado),
  );
}

/** Variante de badge para el estado de la OV en tablas. */
export function variantEstadoOrdenVenta(
  estado: string,
): "positive" | "warning" | "neutral" {
  const normalized = normalizeEstadoOrdenVenta(estado);
  if (
    normalized === "alistada" ||
    normalized === "revisada" ||
    normalized === "facturada" ||
    normalized === "despachada"
  ) {
    return "positive";
  }
  if (normalized === "confirmada" || normalized === "alistamiento") {
    return "warning";
  }
  // por_confirmar y cancelada
  return "neutral";
}
