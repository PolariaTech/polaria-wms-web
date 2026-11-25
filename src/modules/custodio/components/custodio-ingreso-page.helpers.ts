import type { OrdenCompraRow } from "@/modules/purchases";
import {
  getEstadoBodegaSectionConfig,
  type EstadoBodegaSectionView,
} from "@/modules/warehouses";

export const ORDENES_EN_TRANSPORTE = new Set<OrdenCompraRow["estado"]>([
  "emitida",
  "parcialmente_recibida",
]);

export function buildEmptySection(
  sectionId: "entrada" | "salida",
): EstadoBodegaSectionView {
  const config = getEstadoBodegaSectionConfig(sectionId);

  return {
    id: config.id,
    title: config.title,
    cols: config.cols,
    rows: config.rows,
    capacity: config.capacity,
    occupiedCount: 0,
    alertCount: 0,
    pendingTaskCount: 0,
    emptyHint: config.emptyHint,
    showOccupancyBadge: config.showOccupancyBadge,
    slots: Array.from({ length: config.capacity }, (_, index) => ({
      slotNumber: index + 1,
      idUbicacion: null,
      codigo: null,
      visual: "vacia" as const,
      productoLabel: null,
      detalle: null,
    })),
  };
}
