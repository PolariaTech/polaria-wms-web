import type { FlujoOrdenTrabajoApi } from "@/modules/operations";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";

/** Tarea de cola enriquecida con datos de la orden y slots resueltos. */
export interface OperarioTareaView extends TareaColaRow {
  tipoFlujo: FlujoOrdenTrabajoApi | null;
  idUbicacionOrigen: string | null;
  idLoteOrden: string | null;
  origenCodigo: string | null;
  destinoCodigo: string | null;
  ordenCodigo: string | null;
  ordenObservaciones: string | null;
}
