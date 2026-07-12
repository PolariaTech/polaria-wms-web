import {
  listOperariosDisponiblesApi,
  type OperarioDisponibleApiRow,
} from "@/modules/operations";

export interface ListOperariosBodegaParams {
  codigoCuenta: string;
  idBodega: string;
}

/** Operarios de la bodega con carga de tareas y disponibilidad (sesión activa). */
export async function listOperariosBodegaDisponibles(
  params: ListOperariosBodegaParams,
): Promise<OperarioDisponibleApiRow[]> {
  return listOperariosDisponiblesApi(params);
}

export function formatOperarioTareasLabel(tareasPendientes: number): string {
  if (tareasPendientes === 1) return "1 tarea";
  return `${tareasPendientes} tareas`;
}

export function formatOperarioPickerLabel(
  operario: OperarioDisponibleApiRow,
): string {
  return `${operario.nombre} — ${formatOperarioTareasLabel(operario.tareasPendientes)}`;
}
