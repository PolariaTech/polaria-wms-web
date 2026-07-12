import {
  listAlertasOperativasApi,
  listOrdenesTrabajoApi,
  listTareasColaApi,
} from "@/modules/operations";
import { listWarehouseState } from "@/modules/inventory/shared/services/inventory.service";
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

  const [tareasRaw, alertasApi, ordenes, ubicaciones, stock] = await Promise.all([
    listTareasColaApi({ codigoCuenta, idBodega }),
    listAlertasOperativasApi({ codigoCuenta, idBodega, estado: "abierta" }).catch(
      () => [],
    ),
    listOrdenesTrabajoApi({ codigoCuenta, idBodega }),
    listUbicacionesEstadoBodega(idBodega),
    listWarehouseState({ idBodega, codigoCuenta, limit: 500 }),
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

  return buildEstadoBodegaZonePanels({
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
}
