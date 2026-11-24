import { listOrdenesTrabajoApi } from "@/modules/operations";
import {
  listSolicitudesProcesamiento,
  listSolicitudesProcesamientoOperador,
} from "@/modules/processing";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import {
  type ProcesamientoSlotEnriquecimiento,
  type ProcesamientoZonaParams,
} from "./estado-bodega-procesamiento-slot.shared";
import {
  buildProcesamientoEnriquecimientoByUbicacion,
} from "./estado-bodega-procesamiento-slot.build";
import { buildResultadoByUbicacionProcesamiento } from "./estado-bodega-procesamiento-slot.layout";

export async function loadProcesamientoZonaParams(params: {
  codigoCuenta: string;
  idBodega: string;
  warehouseRows: WarehouseStateRow[];
}): Promise<ProcesamientoZonaParams> {
  const { codigoCuenta, idBodega, warehouseRows } = params;

  const [solicitudesOperador, solicitudesDb, ordenes] = await Promise.all([
    listSolicitudesProcesamientoOperador({ codigoCuenta, idBodega }),
    listSolicitudesProcesamiento({ codigoCuenta, idBodega }),
    listOrdenesTrabajoApi({ codigoCuenta, idBodega }),
  ]);

  return {
    solicitudesOperador,
    solicitudesDb,
    ordenes,
    warehouseRows,
  };
}

/** @deprecated Usar loadProcesamientoZonaParams + applyProcesamientoZonaLayout */
export async function loadProcesamientoEnriquecimientoByUbicacion(params: {
  codigoCuenta: string;
  idBodega: string;
  warehouseRows: WarehouseStateRow[];
}): Promise<Map<string, ProcesamientoSlotEnriquecimiento>> {
  const zonaParams = await loadProcesamientoZonaParams(params);
  return buildProcesamientoEnriquecimientoByUbicacion(zonaParams);
}

/** @deprecated Usar loadProcesamientoZonaParams */
export async function loadResultadoByUbicacionProcesamiento(params: {
  codigoCuenta: string;
  idBodega: string;
  warehouseRows: WarehouseStateRow[];
}): Promise<Map<string, string>> {
  const zonaParams = await loadProcesamientoZonaParams(params);
  return buildResultadoByUbicacionProcesamiento(zonaParams);
}
