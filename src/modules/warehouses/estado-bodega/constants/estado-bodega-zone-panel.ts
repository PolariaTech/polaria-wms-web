import type { EstadoBodegaSectionId } from "./estado-bodega-layout";
import type { TipoTarea } from "@/modules/processing/shared/types/processing.types";

export type EstadoBodegaZonePanelKind = "alertas" | "tareas";

export const ESTADO_BODEGA_SECTION_TASK_TYPES: Record<
  EstadoBodegaSectionId,
  readonly TipoTarea[]
> = {
  entrada: ["ingreso"],
  almacenamiento: ["movimiento", "revision", "otro"],
  procesamiento: ["procesamiento"],
  salida: ["despacho"],
};

export const ESTADO_BODEGA_ZONE_ALERTAS_DESCRIPTION: Record<
  EstadoBodegaSectionId,
  string
> = {
  entrada: "Detalles de alertas activas en esta zona.",
  almacenamiento: "Detalles de alertas activas en almacenamiento.",
  procesamiento: "Detalles de alertas activas en procesamiento.",
  salida: "Detalles de alertas activas en salida.",
};

export const ESTADO_BODEGA_ZONE_TAREAS_DESCRIPTION: Record<
  EstadoBodegaSectionId,
  string
> = {
  entrada: "Órdenes y entradas pendientes en esta zona (sin demora).",
  almacenamiento: "Movimientos y revisiones pendientes en almacenamiento.",
  procesamiento: "Órdenes de procesamiento pendientes en esta zona.",
  salida: "Despachos y salidas pendientes en esta zona (sin demora).",
};
