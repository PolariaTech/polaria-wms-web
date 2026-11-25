import type { FlujoOrdenTrabajoApi, OrdenTrabajoApiRow } from "@/modules/operations";
import {
  extractOvCodigoFromText,
  textoReferenciaOrdenVenta,
} from "@/modules/operations/shared/utils/orden-trabajo-api.mapper";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import { isTareaPendienteOperativa } from "./estado-bodega-zone-operativo.secciones";

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
export function buildOvKeysSalidaResuelta(
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

export function buildTareasOcultasPorOrdenTerminal(
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
export function buildOvKeysSinStockEnOrigen(
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

export function shouldOcultarTareaOvPendiente(
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
