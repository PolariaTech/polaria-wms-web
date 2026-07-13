import { aplicarOrdenProcesamiento, iniciarProcesamiento } from "@/modules/processing";
import { parseRolDevolucionProcesamiento } from "@/modules/processing/shared/constants/procesamiento-post-cierre";
import { parseProcesamientoSolicitudRef } from "@/modules/processing/shared/constants/procesamiento-solicitud-ref";
import { completarTareaColaApi } from "@/modules/operations";
import type { OperarioTareaView } from "../types/operario-tarea.types";

export function resolveIdSolicitudProcesamientoFromTarea(
  tarea: OperarioTareaView,
): string | null {
  const explicit = tarea.id_solicitud_procesamiento?.trim();
  if (explicit) return explicit;

  return parseProcesamientoSolicitudRef(
    tarea.titulo,
    tarea.descripcion,
    tarea.ordenObservaciones,
  );
}

/** Retiro almacenamiento → procesamiento (operario, fase 1). */
export function isTareaProcesamientoMovimiento(tarea: OperarioTareaView): boolean {
  if (isTareaPostCierreRetorno(tarea)) return false;

  return (
    tarea.tipo === "procesamiento" || tarea.tipoFlujo === "a_procesamiento"
  );
}

/** Devolución procesamiento → almacenamiento (operario, fase post-cierre). */
export function isTareaPostCierreRetorno(tarea: OperarioTareaView): boolean {
  const idSolicitud = resolveIdSolicitudProcesamientoFromTarea(tarea);
  if (!idSolicitud) return false;

  const rol = parseRolDevolucionProcesamiento(
    tarea.ordenObservaciones,
    tarea.descripcion,
    tarea.titulo,
  );

  return rol !== null;
}

export function resolvePostCierreRolLabel(tarea: OperarioTareaView): string {
  const rol = parseRolDevolucionProcesamiento(
    tarea.ordenObservaciones,
    tarea.descripcion,
    tarea.titulo,
  );

  if (rol === "procesado") return "Resultado procesado";
  if (rol === "desperdicio") return "Sobrante primario";
  return "Post-cierre";
}

export async function completarTareaOperario(params: {
  tarea: OperarioTareaView;
  codigoCuenta: string;
  idBodega: string;
}): Promise<void> {
  const { tarea, codigoCuenta, idBodega } = params;

  if (isTareaProcesamientoMovimiento(tarea)) {
    const idSolicitud = resolveIdSolicitudProcesamientoFromTarea(tarea);
    if (!idSolicitud) {
      throw new Error(
        "No se encontró la solicitud de procesamiento vinculada a la tarea.",
      );
    }

    await iniciarProcesamiento(idSolicitud, { codigoCuenta, idBodega });
  } else if (isTareaPostCierreRetorno(tarea)) {
    const idSolicitud = resolveIdSolicitudProcesamientoFromTarea(tarea);
    const idOrden = tarea.id_orden_trabajo?.trim();

    if (!idSolicitud || !idOrden) {
      throw new Error(
        "No se encontró la orden de post-cierre vinculada a la tarea.",
      );
    }

    await aplicarOrdenProcesamiento(idSolicitud, idOrden);
  }

  await completarTareaColaApi(tarea.id_tarea, { codigoCuenta, idBodega });
}
