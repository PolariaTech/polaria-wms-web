import { listTareasColaApi } from "@/modules/operations";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import type { OperarioTareaView } from "../types/operario-tarea.types";
import { enrichOperarioTareas } from "./operario-tareas-enrich.service";

export interface ListTareasOperarioABodegaParams {
  codigoCuenta: string | null;
  idBodega: string | null;
  idUsuario: string | null;
}

const OPERARIO_TAREA_TIPOS: readonly TareaColaRow["tipo"][] = [
  "movimiento",
  "despacho",
  "revision",
  "ingreso",
];

/** Tareas pendientes asignadas al operario, enriquecidas con orden y ubicaciones. */
export async function listTareasOperarioABodega(
  params: ListTareasOperarioABodegaParams,
): Promise<OperarioTareaView[]> {
  const { codigoCuenta, idBodega, idUsuario } = params;

  if (!codigoCuenta || !idBodega || !idUsuario) {
    return [];
  }

  const rows = await listTareasColaApi({
    codigoCuenta,
    idBodega,
    idAsignado: idUsuario,
    estado: "pendiente",
  });

  const filtered = rows.filter((row) => OPERARIO_TAREA_TIPOS.includes(row.tipo));

  return enrichOperarioTareas({
    codigoCuenta,
    idBodega,
    tareas: filtered,
  });
}
