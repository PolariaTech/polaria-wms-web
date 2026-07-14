import { listOrdenesTrabajoApi } from "@/modules/operations";
import { listUbicacionesEstadoBodega } from "@/modules/warehouses/estado-bodega/services/estado-bodega.service";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import type { OperarioTareaView } from "../types/operario-tarea.types";

interface EnrichOperarioTareasParams {
  codigoCuenta: string;
  idBodega: string;
  tareas: TareaColaRow[];
}

function resolveUbicacionCodigo(
  idUbicacion: string | null | undefined,
  codigoByUbicacion: Map<string, string>,
): string | null {
  if (!idUbicacion?.trim()) return null;
  return codigoByUbicacion.get(idUbicacion.trim()) ?? null;
}

/** Une tarea_cola con orden_trabajo y códigos de ubicación para la UI del operario. */
export async function enrichOperarioTareas(
  params: EnrichOperarioTareasParams,
): Promise<OperarioTareaView[]> {
  const { codigoCuenta, idBodega, tareas } = params;
  if (tareas.length === 0) return [];

  const [ordenes, ubicaciones] = await Promise.all([
    listOrdenesTrabajoApi({ codigoCuenta, idBodega }),
    listUbicacionesEstadoBodega(idBodega),
  ]);

  const ordenById = new Map(ordenes.map((orden) => [orden.idOrdenTrabajo, orden]));
  const codigoByUbicacion = new Map(
    ubicaciones.map((ubicacion) => [ubicacion.id_ubicacion, ubicacion.codigo]),
  );

  return tareas.map((tarea) => {
    const orden = tarea.id_orden_trabajo
      ? ordenById.get(tarea.id_orden_trabajo)
      : undefined;

    let origenCodigo = resolveUbicacionCodigo(
      orden?.idUbicacionOrigen,
      codigoByUbicacion,
    );
    let destinoCodigo = resolveUbicacionCodigo(
      orden?.idUbicacionDestino,
      codigoByUbicacion,
    );

    if (orden?.tipoFlujo === "revisar") {
      const slot = origenCodigo ?? destinoCodigo;
      origenCodigo = slot;
      destinoCodigo = slot;
    }

    return {
      ...tarea,
      tipoFlujo: orden?.tipoFlujo ?? null,
      idUbicacionOrigen: orden?.idUbicacionOrigen?.trim() || null,
      idLoteOrden: orden?.idLote?.trim() || null,
      origenCodigo,
      destinoCodigo,
      ordenCodigo: orden?.codigo?.trim() || null,
      ordenObservaciones: orden?.observaciones ?? null,
    };
  });
}
