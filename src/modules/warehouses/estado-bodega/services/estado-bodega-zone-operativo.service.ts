import {
  listAlertasOperativasApi,
  listOrdenesTrabajoApi,
  listTareasColaApi,
} from "@/modules/operations";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
import { listSolicitudesProcesamientoOperador, listSolicitudesProcesamiento } from "@/modules/processing";
import {
  appendProcesamientoSolicitudesOperadorToPanel,
  appendPendientesCierreToProcesamientoPanel,
  appendEnProcesoToProcesamientoPanel,
  filterSolicitudesOperadorPendientesJefe,
} from "@/modules/processing/shared/utils/procesamiento-jefe-panel";
import { listUbicacionesEstadoBodega } from "./estado-bodega.service";
import {
  buildEstadoBodegaZonePanels,
  enrichTareasConOrden,
  isTareaPendienteOperativa,
} from "../utils/estado-bodega-zone-operativo";
import {
  listAlmacenamientoVentaUbicacionIds,
  listIngresoUbicacionIds,
  listSalidaUbicacionIds,
} from "../utils/estado-bodega-zone-ubicaciones";
import { syncDemoraAlertasHistorial } from "./estado-bodega-demora-alerta-sync.service";
import type { EstadoBodegaSectionId } from "../constants/estado-bodega-layout";
import type {
  AlertaOperativaListRow,
  EstadoBodegaZonePanelItem,
} from "../utils/estado-bodega-zone-panel";

export interface EstadoBodegaZoneOperativoData {
  tareasBySection: Record<EstadoBodegaSectionId, EstadoBodegaZonePanelItem[]>;
  alertasBySection: Record<EstadoBodegaSectionId, EstadoBodegaZonePanelItem[]>;
}

export async function loadEstadoBodegaZoneOperativoData(params: {
  codigoCuenta: string;
  idBodega: string;
}): Promise<EstadoBodegaZoneOperativoData> {
  const { codigoCuenta, idBodega } = params;

  const [tareasRaw, alertasApi, ordenes, ubicaciones, stock, solicitudesRaw, solicitudesDb] =
    await Promise.all([
    listTareasColaApi({ codigoCuenta, idBodega }),
    listAlertasOperativasApi({ codigoCuenta, idBodega, estado: "abierta" }).catch(
      () => [],
    ),
    listOrdenesTrabajoApi({ codigoCuenta, idBodega }),
    listUbicacionesEstadoBodega(idBodega),
    listWarehouseState({ idBodega, codigoCuenta, limit: 500 }),
    listSolicitudesProcesamientoOperador({ codigoCuenta, idBodega }).catch(
      () => [],
    ),
    listSolicitudesProcesamiento({ codigoCuenta, idBodega }).catch(() => []),
  ]);

  const tareas = tareasRaw.filter(isTareaPendienteOperativa);

  const alertasDb: AlertaOperativaListRow[] = alertasApi.map((alerta) => ({
    id_alerta: alerta.idAlerta,
    titulo: alerta.titulo,
    descripcion: alerta.descripcion,
    estado: alerta.estado,
    created_at: alerta.createdAt,
    payload: null,
  }));

  const codigoByUbicacion = new Map(
    ubicaciones.map((ubicacion) => [ubicacion.id_ubicacion, ubicacion.codigo]),
  );
  const ingresoUbicacionIds = listIngresoUbicacionIds(ubicaciones);
  const salidaUbicacionIds = listSalidaUbicacionIds(ubicaciones);
  const almacenUbicacionIds = listAlmacenamientoVentaUbicacionIds(ubicaciones);

  const tareasEnriquecidas = enrichTareasConOrden(
    tareas,
    ordenes,
    codigoByUbicacion,
  );

  const stockIngreso = stock.filter((row) =>
    ingresoUbicacionIds.has(row.id_ubicacion),
  );

  void syncDemoraAlertasHistorial({ codigoCuenta, idBodega }).catch(() => {});

  const panels = buildEstadoBodegaZonePanels({
    alertasDb,
    tareas: tareasEnriquecidas,
    ordenes,
    stock,
    almacenUbicacionIds,
    stockIngreso,
    ingresoUbicacionIds,
    salidaUbicacionIds,
    codigoByUbicacion,
  });

  const solicitudIdsConOperario = new Set(
    solicitudesDb
      .filter((solicitud) => Boolean(solicitud.id_operario?.trim()))
      .map((solicitud) => solicitud.id_solicitud_procesamiento),
  );

  const solicitudesPendientes = filterSolicitudesOperadorPendientesJefe(
    solicitudesRaw,
    tareas,
    solicitudIdsConOperario,
  );

  panels.tareasBySection.almacenamiento =
    appendProcesamientoSolicitudesOperadorToPanel(
      panels.tareasBySection.almacenamiento,
      solicitudesPendientes,
    );

  const pendientesCierre = solicitudesRaw.filter(
    (s) => s.estado === "pendiente_cierre",
  );
  const enProceso = solicitudesRaw.filter((s) => s.estado === "en_proceso");
  const sobranteById = new Map(
    solicitudesDb.map((s) => [
      s.id_solicitud_procesamiento,
      s.sobrante_kg,
    ]),
  );

  panels.tareasBySection.procesamiento = appendEnProcesoToProcesamientoPanel(
    panels.tareasBySection.procesamiento,
    enProceso,
  );

  panels.tareasBySection.procesamiento =
    appendPendientesCierreToProcesamientoPanel(
      panels.tareasBySection.procesamiento,
      pendientesCierre,
      sobranteById,
    );

  return panels;
}
