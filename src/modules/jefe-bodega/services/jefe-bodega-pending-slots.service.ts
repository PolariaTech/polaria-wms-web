import {
  listOrdenesTrabajoApi,
  listTareasColaApi,
} from "@/modules/operations";
import type { FlujoOrdenTrabajoApi } from "@/modules/operations";
import {
  buildUbicacionesOrigenPendientesIds,
  isTareaPendienteOperativa,
} from "@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-operativo";

export async function listUbicacionesOrigenBloqueadasPorTarea(params: {
  codigoCuenta: string;
  idBodega: string;
  tipoFlujos?: readonly FlujoOrdenTrabajoApi[];
}): Promise<Set<string>> {
  const tipoFlujos = params.tipoFlujos ?? (["a_bodega"] as const);

  const [tareasRaw, ordenes] = await Promise.all([
    listTareasColaApi({
      codigoCuenta: params.codigoCuenta,
      idBodega: params.idBodega,
    }),
    listOrdenesTrabajoApi({
      codigoCuenta: params.codigoCuenta,
      idBodega: params.idBodega,
    }),
  ]);

  const tareas = tareasRaw.filter(isTareaPendienteOperativa);

  return buildUbicacionesOrigenPendientesIds(tareas, ordenes, tipoFlujos);
}
