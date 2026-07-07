export type EstadoBodegaSectionId =
  | "entrada"
  | "almacenamiento"
  | "procesamiento"
  | "salida";

export type EstadoBodegaSlotVisual =
  | "vacia"
  | "ocupada_primario"
  | "ocupada_procesado";

export interface EstadoBodegaSectionConfig {
  id: EstadoBodegaSectionId;
  title: string;
  cols: number;
  rows: number;
  capacity: number;
  emptyHint?: string;
  showOccupancyBadge?: boolean;
}

export const ESTADO_BODEGA_SECTIONS: readonly EstadoBodegaSectionConfig[] = [
  {
    id: "entrada",
    title: "Entrada",
    cols: 2,
    rows: 4,
    capacity: 8,
    emptyHint: "No hay cajas en ingreso",
  },
  {
    id: "almacenamiento",
    title: "Almacenamiento",
    cols: 4,
    rows: 3,
    capacity: 12,
  },
  {
    id: "procesamiento",
    title: "Procesamiento",
    cols: 4,
    rows: 1,
    capacity: 4,
  },
  {
    id: "salida",
    title: "Salida",
    cols: 2,
    rows: 4,
    capacity: 8,
    emptyHint: "No hay cajas en salida",
  },
] as const;

export function getEstadoBodegaSectionConfig(
  id: EstadoBodegaSectionId,
): EstadoBodegaSectionConfig {
  const section = ESTADO_BODEGA_SECTIONS.find((item) => item.id === id);
  if (!section) {
    throw new Error(`Sección de bodega desconocida: ${id}`);
  }
  return section;
}
