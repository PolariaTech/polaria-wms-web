import {
  asignarOperarioProcesamiento,
  listSolicitudesProcesamientoOperador,
} from "@/modules/processing";
import { filterSolicitudesOperadorPendientesJefe } from "@/modules/processing/shared/utils/procesamiento-jefe-panel";
import { listTareasColaApi } from "@/modules/operations";
import { isTareaPendienteOperativa } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-zone-operativo";

export async function listSolicitudesProcesamientoPendientesJefe(params: {
  codigoCuenta: string;
  idBodega: string;
}) {
  const [solicitudes, tareas] = await Promise.all([
    listSolicitudesProcesamientoOperador({
      codigoCuenta: params.codigoCuenta,
      idBodega: params.idBodega,
    }),
    listTareasColaApi({
      codigoCuenta: params.codigoCuenta,
      idBodega: params.idBodega,
    }).catch(() => []),
  ]);

  return filterSolicitudesOperadorPendientesJefe(
    solicitudes,
    tareas.filter(isTareaPendienteOperativa),
  );
}

export async function asignarOperarioProcesamientoJefe(params: {
  idSolicitudProcesamiento: string;
  codigoCuenta: string;
  idBodega: string;
  idOperario: string;
}) {
  return asignarOperarioProcesamiento(params.idSolicitudProcesamiento, {
    codigoCuenta: params.codigoCuenta,
    idBodega: params.idBodega,
    idOperario: params.idOperario,
  });
}
