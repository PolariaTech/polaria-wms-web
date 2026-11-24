import type { FlujoOrdenTrabajoApi, OrdenTrabajoApiRow } from "@/modules/operations";
import {
  extractOvCodigoFromText,
} from "@/modules/operations/shared/utils/orden-trabajo-api.mapper";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type { EstadoBodegaSectionId } from "../constants/estado-bodega-layout";
import { TEMPERATURA_ALTA_UMBRAL_C } from "../constants/estado-bodega-zone-operativo.constants";
import type { AlertaOperativaListRow, EstadoBodegaZonePanelItem } from "./estado-bodega-zone-panel";
import { filterAlertasForSection, mapAlertaToPanelItem } from "./estado-bodega-zone-panel";
import {
  type ResolveTareaSectionContext,
  type TareaColaEnriquecida,
  isTareaOvPreparacionAlmacenamiento,
} from "./estado-bodega-zone-operativo.tareas";
import {
  filterTareasOvDuplicadas,
  getTareaEdadMs,
  isTareaAsignadaOperativa,
  isTareaDemorada,
  isTareaPendienteOperativa,
  resolveTareaSectionId,
} from "./estado-bodega-zone-operativo.secciones";

function mapTareaEnriquecidaToPanelItem(
  tarea: TareaColaEnriquecida,
): EstadoBodegaZonePanelItem {
  const origen = tarea.origenCodigo ?? "—";
  const destino = tarea.destinoCodigo ?? "—";
  const orden = tarea.ordenCodigo ? ` · ${tarea.ordenCodigo}` : "";
  const ruta =
    tarea.origenCodigo || tarea.destinoCodigo
      ? `${origen} → ${destino}`
      : undefined;
  const subtitleParts = [
    !isTareaAsignadaOperativa(tarea) ? "Sin operario asignado" : null,
    tarea.descripcion?.trim() || ruta || undefined,
  ].filter(Boolean);

  const esOvPreparacion = isTareaOvPreparacionAlmacenamiento(tarea);
  const ovCodigo = extractOvCodigoFromText(
    tarea.descripcion,
    tarea.titulo,
    tarea.ordenObservaciones,
  );

  return {
    id: tarea.id_tarea,
    title:
      tarea.titulo?.trim() ||
      `${origen} → ${destino}${orden}`.trim(),
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined,
    ovSalida: esOvPreparacion
      ? {
          idOrdenVenta: tarea.idOrdenVenta,
          ovCodigo,
          idUbicacionOrigen: tarea.idUbicacionOrigen,
        }
      : undefined,
  };
}

function parseTemperaturaCelsius(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildTemperaturaAltaAlertas(
  stockIngreso: WarehouseStateRow[],
  ingresoUbicacionIds: Set<string>,
  codigoByUbicacion: Map<string, string>,
): EstadoBodegaZonePanelItem[] {
  const items: EstadoBodegaZonePanelItem[] = [];
  const seen = new Set<string>();

  for (const row of stockIngreso) {
    if (!ingresoUbicacionIds.has(row.id_ubicacion)) continue;

    const temp = parseTemperaturaCelsius(row.temperatura);
    if (temp == null || temp <= TEMPERATURA_ALTA_UMBRAL_C) continue;

    const slot = codigoByUbicacion.get(row.id_ubicacion) ?? "Ingreso";
    const key = `${row.id_ubicacion}:${temp}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      id: `temp-${row.id_warehouse_state}`,
      title: `Temperatura alta en ${slot}`,
      subtitle: `${temp.toLocaleString("es-CL", { maximumFractionDigits: 1 })} °C (umbral ${TEMPERATURA_ALTA_UMBRAL_C} °C)`,
    });
  }

  return items;
}

function buildDemoraAlertas(
  tareas: TareaColaEnriquecida[],
  sectionId: EstadoBodegaSectionId,
  context: ResolveTareaSectionContext,
  now = Date.now(),
): EstadoBodegaZonePanelItem[] {
  return tareas
    .filter(
      (tarea) =>
        isTareaPendienteOperativa(tarea) &&
        isTareaDemorada(tarea, now) &&
        resolveTareaSectionId(tarea, context) === sectionId,
    )
    .map((tarea) => {
      const minutos = Math.floor(getTareaEdadMs(tarea, now) / 60_000);
      const origen = tarea.origenCodigo ?? "—";
      const destino = tarea.destinoCodigo ?? "—";
      return {
        id: `demora-${tarea.id_tarea}`,
        title: `Tarea demorada (+${minutos} min)`,
        subtitle: `${origen} → ${destino}${tarea.ordenCodigo ? ` · ${tarea.ordenCodigo}` : ""}`,
      };
    });
}

export interface DemoraAlertaOperativaDraft {
  idTarea: string;
  idOrdenTrabajo: string | null;
  idUbicacionOrigen: string | null;
  sectionId: EstadoBodegaSectionId;
  titulo: string;
  descripcion: string | null;
}

export function collectDemoraAlertasOperativas(
  tareas: TareaColaEnriquecida[],
  context: ResolveTareaSectionContext,
  now = Date.now(),
): DemoraAlertaOperativaDraft[] {
  const sectionIds: EstadoBodegaSectionId[] = [
    "entrada",
    "almacenamiento",
    "procesamiento",
    "salida",
  ];

  const drafts: DemoraAlertaOperativaDraft[] = [];

  for (const sectionId of sectionIds) {
    for (const panel of buildDemoraAlertas(tareas, sectionId, context, now)) {
      const idTarea = panel.id.replace(/^demora-/, "");
      const tarea = tareas.find((row) => row.id_tarea === idTarea);
      if (!tarea) continue;

      drafts.push({
        idTarea,
        idOrdenTrabajo: tarea.id_orden_trabajo?.trim() || null,
        idUbicacionOrigen: tarea.idUbicacionOrigen,
        sectionId,
        titulo: panel.title,
        descripcion: panel.subtitle ?? null,
      });
    }
  }

  return drafts;
}


export function buildUbicacionesOrigenPendientesIds(
  tareas: TareaColaRow[],
  ordenes: OrdenTrabajoApiRow[],
  tipoFlujos: readonly FlujoOrdenTrabajoApi[],
): Set<string> {
  const allowed = new Set(tipoFlujos);
  const ordenById = new Map(
    ordenes.map((orden) => [orden.idOrdenTrabajo.trim().toLowerCase(), orden]),
  );
  const ids = new Set<string>();

  for (const tarea of tareas) {
    if (!isTareaPendienteOperativa(tarea)) continue;
    const orden = tarea.id_orden_trabajo
      ? ordenById.get(tarea.id_orden_trabajo.trim().toLowerCase())
      : undefined;
    if (!orden?.tipoFlujo || !allowed.has(orden.tipoFlujo)) continue;

    const ubicacionId =
      orden.tipoFlujo === "revisar"
        ? orden.idUbicacionDestino?.trim() || orden.idUbicacionOrigen?.trim()
        : orden.idUbicacionOrigen?.trim();

    if (ubicacionId) {
      ids.add(ubicacionId);
    }
  }

  return ids;
}

export function buildEstadoBodegaZonePanels(input: {
  alertasDb: AlertaOperativaListRow[];
  tareas: TareaColaEnriquecida[];
  ordenes?: OrdenTrabajoApiRow[];
  stock?: WarehouseStateRow[];
  almacenUbicacionIds?: Set<string>;
  stockIngreso: WarehouseStateRow[];
  ingresoUbicacionIds: Set<string>;
  salidaUbicacionIds: Set<string>;
  codigoByUbicacion: Map<string, string>;
  now?: number;
}): {
  tareasBySection: Record<EstadoBodegaSectionId, EstadoBodegaZonePanelItem[]>;
  alertasBySection: Record<EstadoBodegaSectionId, EstadoBodegaZonePanelItem[]>;
} {
  const now = input.now ?? Date.now();
  const sectionContext: ResolveTareaSectionContext = {
    ingresoUbicacionIds: input.ingresoUbicacionIds,
    salidaUbicacionIds: input.salidaUbicacionIds,
  };
  const sectionIds: EstadoBodegaSectionId[] = [
    "entrada",
    "almacenamiento",
    "procesamiento",
    "salida",
  ];

  const tareasBySection = Object.fromEntries(
    sectionIds.map((id) => [id, [] as EstadoBodegaZonePanelItem[]]),
  ) as Record<EstadoBodegaSectionId, EstadoBodegaZonePanelItem[]>;

  const alertasBySection = Object.fromEntries(
    sectionIds.map((id) => [id, [] as EstadoBodegaZonePanelItem[]]),
  ) as Record<EstadoBodegaSectionId, EstadoBodegaZonePanelItem[]>;

  const tareasVisibles = filterTareasOvDuplicadas(
    input.tareas,
    input.ordenes ?? [],
    input.stock ?? [],
    input.almacenUbicacionIds ?? new Set(),
  );

  const tareaIdsVisibles = new Set(tareasVisibles.map((tarea) => tarea.id_tarea));

  for (const tarea of tareasVisibles) {
    if (!isTareaPendienteOperativa(tarea)) continue;

    const sectionId = resolveTareaSectionId(tarea, sectionContext);
    tareasBySection[sectionId].push(mapTareaEnriquecidaToPanelItem(tarea));
  }

  for (const sectionId of sectionIds) {
    const dbAlertas = filterAlertasForSection(input.alertasDb, sectionId)
      .filter((alerta) => {
        const idTarea = alerta.payload?.id_tarea;
        if (typeof idTarea !== "string" || !idTarea.trim()) return true;
        return tareaIdsVisibles.has(idTarea.trim());
      })
      .map(mapAlertaToPanelItem);
    const demoras = buildDemoraAlertas(
      tareasVisibles,
      sectionId,
      sectionContext,
      now,
    );
    const temperatura =
      sectionId === "entrada"
        ? buildTemperaturaAltaAlertas(
            input.stockIngreso,
            input.ingresoUbicacionIds,
            input.codigoByUbicacion,
          )
        : [];

    alertasBySection[sectionId] = [...dbAlertas, ...temperatura, ...demoras];
  }

  return { tareasBySection, alertasBySection };
}

export function countPanelItems(
  items: EstadoBodegaZonePanelItem[],
): number {
  return items.length;
}
