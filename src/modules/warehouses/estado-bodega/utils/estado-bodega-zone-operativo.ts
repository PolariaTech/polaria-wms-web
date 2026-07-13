import { parseRolDevolucionProcesamiento } from "@/modules/processing/shared/constants/procesamiento-post-cierre";
import type { FlujoOrdenTrabajoApi, OrdenTrabajoApiRow } from "@/modules/operations";
import {
  extractOvCodigoFromText,
  textoReferenciaOrdenVenta,
} from "@/modules/operations/shared/utils/orden-trabajo-api.mapper";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type { EstadoBodegaSectionId } from "../constants/estado-bodega-layout";
import {
  TAREA_DEMORA_ALERTA_MS,
  TEMPERATURA_ALTA_UMBRAL_C,
} from "../constants/estado-bodega-zone-operativo.constants";
import type {
  AlertaOperativaListRow,
  EstadoBodegaZonePanelItem,
} from "./estado-bodega-zone-panel";
import { filterAlertasForSection, mapAlertaToPanelItem } from "./estado-bodega-zone-panel";

export interface TareaColaEnriquecida extends TareaColaRow {
  tipoFlujo: FlujoOrdenTrabajoApi | null;
  idUbicacionOrigen: string | null;
  idUbicacionDestino: string | null;
  idAsignadoOrden: string | null;
  idOrdenVenta: string | null;
  ordenObservaciones: string | null;
  origenCodigo: string | null;
  destinoCodigo: string | null;
  ordenCodigo: string | null;
}

export interface ResolveTareaSectionContext {
  ingresoUbicacionIds: Set<string>;
  salidaUbicacionIds: Set<string>;
}

function resolveUbicacionCodigo(
  idUbicacion: string | null | undefined,
  codigoByUbicacion: Map<string, string>,
): string | null {
  if (!idUbicacion?.trim()) return null;
  return codigoByUbicacion.get(idUbicacion.trim()) ?? null;
}

export function enrichTareasConOrden(
  tareas: TareaColaRow[],
  ordenes: OrdenTrabajoApiRow[],
  codigoByUbicacion: Map<string, string>,
): TareaColaEnriquecida[] {
  const ordenById = new Map(
    ordenes.map((orden) => [orden.idOrdenTrabajo.trim().toLowerCase(), orden]),
  );

  return tareas.map((tarea) => {
    const orden = tarea.id_orden_trabajo
      ? ordenById.get(tarea.id_orden_trabajo.trim().toLowerCase())
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
      idUbicacionDestino: orden?.idUbicacionDestino?.trim() || null,
      idAsignadoOrden: orden?.idAsignado?.trim() || null,
      idOrdenVenta: orden?.idOrdenVenta?.trim() || null,
      ordenObservaciones: orden?.observaciones?.trim() || null,
      origenCodigo,
      destinoCodigo,
      ordenCodigo: orden?.codigo?.trim() || null,
    };
  });
}

/** Tarea vinculada a una OV (emitida o salida manual). */
export function isTareaVinculadaOrdenVenta(
  tarea: TareaColaEnriquecida,
): boolean {
  if (tarea.idOrdenVenta?.trim()) {
    return true;
  }

  return textoReferenciaOrdenVenta(
    tarea.titulo,
    tarea.descripcion,
    tarea.ordenObservaciones,
  );
}

/** OV ya tiene salida registrada por el jefe (OT a_salida con destino). */
export function isTareaOvSalidaRegistrada(
  tarea: TareaColaEnriquecida,
): boolean {
  return (
    isTareaVinculadaOrdenVenta(tarea) &&
    tarea.tipoFlujo === "a_salida" &&
    Boolean(tarea.idUbicacionDestino?.trim())
  );
}

/** Tarea de preparación post-emisión: pendiente de que el jefe registre salida. */
export function isTareaOvPreparacionAlmacenamiento(
  tarea: TareaColaEnriquecida,
): boolean {
  return (
    isTareaVinculadaOrdenVenta(tarea) && !isTareaOvSalidaRegistrada(tarea)
  );
}

/** @deprecated Usar isTareaVinculadaOrdenVenta */
export function isTareaOrdenVentaEmitida(tarea: TareaColaEnriquecida): boolean {
  return isTareaVinculadaOrdenVenta(tarea);
}

export function resolveTareaOvKey(tarea: TareaColaEnriquecida): string | null {
  const codigo = extractOvCodigoFromText(
    tarea.descripcion,
    tarea.titulo,
    tarea.ordenObservaciones,
  );
  if (codigo) {
    return `ov:${codigo.toLowerCase()}`;
  }

  if (tarea.idOrdenVenta?.trim()) {
    return `id:${tarea.idOrdenVenta.trim().toLowerCase()}`;
  }

  return null;
}

function resolveOrdenTrabajoOvKey(orden: OrdenTrabajoApiRow): string | null {
  const codigo = extractOvCodigoFromText(orden.observaciones);
  if (codigo) {
    return `ov:${codigo.toLowerCase()}`;
  }

  if (orden.idOrdenVenta?.trim()) {
    return `id:${orden.idOrdenVenta.trim().toLowerCase()}`;
  }

  return null;
}

function isOrdenSalidaOvRegistrada(orden: OrdenTrabajoApiRow): boolean {
  return (
    orden.tipoFlujo === "a_salida" &&
    Boolean(orden.idUbicacionDestino?.trim())
  );
}

function isOrdenEnEstadoTerminal(orden: OrdenTrabajoApiRow): boolean {
  const estado = orden.estado?.trim().toLowerCase();
  if (!estado) return false;

  return (
    estado === "completada" ||
    estado === "completado" ||
    estado === "cerrada" ||
    estado === "cerrado" ||
    estado === "cancelada" ||
    estado === "cancelado" ||
    estado === "finalizada" ||
    estado === "finalizado" ||
    estado === "ejecutada" ||
    estado === "ejecutado" ||
    estado === "anulada" ||
    estado === "anulado"
  );
}

function parseCantidadStock(value: string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** OV cuya salida ya se resolvió (OT terminal o sin tarea pendiente asociada). */
function buildOvKeysSalidaResuelta(
  tareas: TareaColaEnriquecida[],
  ordenes: OrdenTrabajoApiRow[],
): Set<string> {
  const pendingOrdenIds = new Set(
    tareas
      .filter(isTareaPendienteOperativa)
      .map((tarea) => tarea.id_orden_trabajo?.trim().toLowerCase())
      .filter((id): id is string => Boolean(id)),
  );

  const keys = new Set<string>();

  for (const orden of ordenes) {
    const key = resolveOrdenTrabajoOvKey(orden);
    if (!key) continue;

    if (isOrdenEnEstadoTerminal(orden)) {
      keys.add(key);
      continue;
    }

    if (!isOrdenSalidaOvRegistrada(orden)) continue;

    const ordenId = orden.idOrdenTrabajo.trim().toLowerCase();
    if (!pendingOrdenIds.has(ordenId)) {
      keys.add(key);
    }
  }

  return keys;
}

function buildTareasOcultasPorOrdenTerminal(
  tareas: TareaColaEnriquecida[],
  ordenes: OrdenTrabajoApiRow[],
): Set<string> {
  const ordenById = new Map(
    ordenes.map((orden) => [orden.idOrdenTrabajo.trim().toLowerCase(), orden]),
  );
  const omitir = new Set<string>();

  for (const tarea of tareas) {
    if (!isTareaPendienteOperativa(tarea)) continue;

    const ordenId = tarea.id_orden_trabajo?.trim().toLowerCase();
    if (!ordenId) continue;

    const orden = ordenById.get(ordenId);
    if (orden && isOrdenEnEstadoTerminal(orden)) {
      omitir.add(tarea.id_tarea);
    }
  }

  return omitir;
}

/** OV cuyo slot origen en almacenamiento ya no tiene stock. */
function buildOvKeysSinStockEnOrigen(
  tareas: TareaColaEnriquecida[],
  stock: WarehouseStateRow[],
  almacenUbicacionIds: Set<string>,
): Set<string> {
  if (stock.length === 0 || almacenUbicacionIds.size === 0) return new Set();

  const stockAlmacenByUbicacion = new Map<string, number>();

  for (const row of stock) {
    const ubicacionId = row.id_ubicacion?.trim();
    if (!ubicacionId || !almacenUbicacionIds.has(ubicacionId)) continue;
    stockAlmacenByUbicacion.set(
      ubicacionId,
      (stockAlmacenByUbicacion.get(ubicacionId) ?? 0) +
        parseCantidadStock(row.cantidad),
    );
  }

  const keys = new Set<string>();

  for (const tarea of tareas) {
    if (!isTareaPendienteOperativa(tarea)) continue;
    if (!isTareaVinculadaOrdenVenta(tarea)) continue;

    const origen = tarea.idUbicacionOrigen?.trim();
    if (!origen || !almacenUbicacionIds.has(origen)) continue;

    if ((stockAlmacenByUbicacion.get(origen) ?? 0) > 0) continue;

    const key = resolveTareaOvKey(tarea);
    if (key) keys.add(key);
  }

  return keys;
}

function shouldOcultarTareaOvPendiente(
  tarea: TareaColaEnriquecida,
  ovSalidaResuelta: Set<string>,
  ovSinStockEnOrigen: Set<string>,
): boolean {
  if (!isTareaPendienteOperativa(tarea)) return false;
  if (!isTareaVinculadaOrdenVenta(tarea)) return false;

  const key = resolveTareaOvKey(tarea);
  if (!key) return false;

  return ovSalidaResuelta.has(key) || ovSinStockEnOrigen.has(key);
}

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
