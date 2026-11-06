import type { OrdenTrabajoHija } from "../origen/origen-correo-ordenes-trabajo";
import type { EstadoBaseApi, OtEstadoBaseApi } from "./reagrupar-ordenes-trabajo";

/** Tarea del estado base con el día y el horario de entrega (REQ-262). */
export type OtConDiaYHorario = OtEstadoBaseApi & { fecha: string; horario: string };

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

/**
 * Horario de entrega de una tarea: la ventana «desde - hasta» de su primer renglón y, si
 * no la tiene, el texto de «Horario». El servidor arma el mismo texto desde lo guardado.
 */
export function horarioDeLaTarea(hija: OrdenTrabajoHija): string {
  const primero = hija.renglones[0];
  if (!primero) return "";
  const ventana = [primero["Ventana desde"], primero["Ventana hasta"]]
    .map(texto)
    .filter((parte) => parte.length > 0);
  return ventana.length > 0 ? ventana.join(" - ") : texto(primero.Horario);
}

/**
 * Agrega a cada tarea del estado base su día y su horario de entrega, para que Reorganizar
 * pueda dividir la orden por día u horario. Las tareas van en el mismo orden que las hijas.
 */
export function conDiaYHorario(
  estadoBase: EstadoBaseApi,
  hijas: readonly OrdenTrabajoHija[],
): { ots: OtConDiaYHorario[] } {
  return {
    ots: estadoBase.ots.map((ot, indice) => ({
      ...ot,
      fecha: texto(hijas[indice]?.fecha),
      horario: hijas[indice] ? horarioDeLaTarea(hijas[indice]) : "",
    })),
  };
}
