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
  entrada: "Temperatura alta y tareas con más de 5 minutos sin cumplir.",
  almacenamiento: "Tareas con más de 5 minutos sin cumplir en almacenamiento.",
  procesamiento: "Tareas con más de 5 minutos sin cumplir en procesamiento.",
  salida: "Tareas con más de 5 minutos sin cumplir en salida.",
};

export const ESTADO_BODEGA_ZONE_TAREAS_DESCRIPTION: Record<
  EstadoBodegaSectionId,
  string
> = {
  entrada: "Ingresos pendientes o asignados al operario.",
  almacenamiento: "Movimientos y revisiones pendientes o asignados al operario.",
  procesamiento: "Procesamiento pendiente o asignado al operario.",
  salida: "Despachos y salidas pendientes o asignados al operario.",
};
