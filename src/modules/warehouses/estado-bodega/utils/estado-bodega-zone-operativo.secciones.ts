import {
  parseRolDevolucionProcesamiento,
} from "@/modules/processing/shared/constants/procesamiento-post-cierre";
import type { OrdenTrabajoApiRow } from "@/modules/operations";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type { EstadoBodegaSectionId } from "../constants/estado-bodega-layout";
import { TAREA_DEMORA_ALERTA_MS } from "../constants/estado-bodega-zone-operativo.constants";
import {
  type ResolveTareaSectionContext,
  type TareaColaEnriquecida,
  buildOvKeysSalidaResuelta,
  buildOvKeysSinStockEnOrigen,
  buildTareasOcultasPorOrdenTerminal,
  isTareaOvSalidaRegistrada,
  isTareaVinculadaOrdenVenta,
  resolveTareaOvKey,
  shouldOcultarTareaOvPendiente,
} from "./estado-bodega-zone-operativo.tareas";

/** Para la misma OV, deja una sola tarea visible (la de salida registrada, si existe). */
export function filterTareasOvDuplicadas(
  tareas: TareaColaEnriquecida[],
  ordenes: OrdenTrabajoApiRow[] = [],
  stock: WarehouseStateRow[] = [],
  almacenUbicacionIds: Set<string> = new Set(),
): TareaColaEnriquecida[] {
  const grupos = new Map<string, TareaColaEnriquecida[]>();
  const omitir = new Set<string>();

  for (const tarea of tareas) {
    if (!isTareaPendienteOperativa(tarea)) continue;
    if (!isTareaVinculadaOrdenVenta(tarea)) continue;

    const key = resolveTareaOvKey(tarea);
    if (!key) continue;

    const grupo = grupos.get(key) ?? [];
    grupo.push(tarea);
    grupos.set(key, grupo);
  }

  for (const grupo of grupos.values()) {
    if (grupo.length <= 1) continue;

    const ordenadas = [...grupo].sort((a, b) => {
      const score = (t: TareaColaEnriquecida) => {
        let value = 0;
        if (isTareaOvSalidaRegistrada(t)) value += 100;
        if (isTareaAsignadaOperativa(t)) value += 10;
        return value;
      };
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });

    for (const tarea of ordenadas.slice(1)) {
      omitir.add(tarea.id_tarea);
    }
  }

  const ovSalidaResuelta = buildOvKeysSalidaResuelta(tareas, ordenes);
  const ovSinStockEnOrigen = buildOvKeysSinStockEnOrigen(
    tareas,
    stock,
    almacenUbicacionIds,
  );
  const tareasOrdenTerminal = buildTareasOcultasPorOrdenTerminal(tareas, ordenes);

  return tareas.filter((tarea) => {
    if (omitir.has(tarea.id_tarea)) return false;
    if (tareasOrdenTerminal.has(tarea.id_tarea)) return false;

    if (shouldOcultarTareaOvPendiente(tarea, ovSalidaResuelta, ovSinStockEnOrigen)) {
      return false;
    }

    return true;
  });
}

export function resolveTareaSectionId(
  tarea: TareaColaEnriquecida,
  context?: ResolveTareaSectionContext,
): EstadoBodegaSectionId {
  if (isTareaVinculadaOrdenVenta(tarea)) {
    return "almacenamiento";
  }

  if (
    parseRolDevolucionProcesamiento(
      tarea.ordenObservaciones,
      tarea.descripcion,
      tarea.titulo,
    )
  ) {
    return "procesamiento";
  }

  switch (tarea.tipoFlujo) {
    case "a_bodega":
      return "entrada";
    case "a_salida":
      return "salida";
    case "a_procesamiento":
      return "almacenamiento";
    case "bodega_a_bodega":
    case "revisar":
      return "almacenamiento";
    default:
      break;
  }

  if (context) {
    const origen = tarea.idUbicacionOrigen?.trim();
    const destino = tarea.idUbicacionDestino?.trim();

    if (origen && context.ingresoUbicacionIds.has(origen)) {
      return "entrada";
    }

    if (
      (origen && context.salidaUbicacionIds.has(origen)) ||
      (destino && context.salidaUbicacionIds.has(destino))
    ) {
      return "salida";
    }
  }

  switch (tarea.tipo) {
    case "ingreso":
      return "entrada";
    case "despacho":
      return "salida";
    case "procesamiento":
      return "almacenamiento";
    case "movimiento":
    case "revision":
    case "otro":
      return "almacenamiento";
    default:
      return "almacenamiento";
  }
}

export function isTareaAsignada(tarea: TareaColaRow): boolean {
  return Boolean(tarea.id_asignado?.trim());
}

export function isTareaAsignadaOperativa(tarea: TareaColaEnriquecida): boolean {
  return isTareaAsignada(tarea) || Boolean(tarea.idAsignadoOrden?.trim());
}

export function isTareaPendienteOperativa(tarea: TareaColaRow): boolean {
  return tarea.estado === "pendiente" || tarea.estado === "en_proceso";
}

export function getTareaEdadMs(tarea: TareaColaRow, now = Date.now()): number {
  const created = Date.parse(tarea.created_at);
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, now - created);
}

export function isTareaDemorada(
  tarea: TareaColaRow,
  now = Date.now(),
): boolean {
  return getTareaEdadMs(tarea, now) > TAREA_DEMORA_ALERTA_MS;
}
