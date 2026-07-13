import { listOrdenesTrabajoApi } from "@/modules/operations";
import type { OrdenTrabajoApiRow } from "@/modules/operations";
import {
  listSolicitudesProcesamiento,
  listSolicitudesProcesamientoOperador,
} from "@/modules/processing";
import { solicitudTieneSobrantePendiente } from "@/modules/processing/shared/constants/procesamiento-post-cierre";
import { parseProcesamientoSolicitudRef } from "@/modules/processing/shared/constants/procesamiento-solicitud-ref";
import {
  formatKilos,
  formatUnidades,
} from "@/modules/processing/shared/constants/processing-status";
import type {
  EstadoProcesamiento,
  SolicitudProcesamientoOperadorRow,
  SolicitudProcesamientoRow,
} from "@/modules/processing/shared/types/processing.types";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type {
  EstadoBodegaLayoutView,
  EstadoBodegaSectionView,
  EstadoBodegaSlot,
  EstadoBodegaSlotDetalleView,
} from "../types/estado-bodega.types";

const ESTADOS_ACTIVOS_PROCESAMIENTO = new Set<EstadoProcesamiento>([
  "en_proceso",
  "pendiente_cierre",
]);

export interface ProcesamientoSlotEnriquecimiento {
  idSolicitud: string;
  estado: EstadoProcesamiento;
  ordenCodigo: string;
  primarioNombre: string;
  resultadoNombre: string;
  sobranteKg: number | null;
  unidadesSecundario: number | null;
}

export interface ProcesamientoZonaParams {
  solicitudesOperador: SolicitudProcesamientoOperadorRow[];
  solicitudesDb: SolicitudProcesamientoRow[];
  ordenes: OrdenTrabajoApiRow[];
  warehouseRows: WarehouseStateRow[];
}

function isSolicitudActivaEnProcesamiento(
  estado: EstadoProcesamiento,
): boolean {
  return ESTADOS_ACTIVOS_PROCESAMIENTO.has(estado);
}

function parsePositiveNumber(
  value: string | number | null | undefined,
): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function padProcesamientoSlots(
  slots: EstadoBodegaSlot[],
  capacity: number,
): EstadoBodegaSlot[] {
  const occupied = slots.filter((slot) => slot.visual !== "vacia");
  const vacias = slots.filter((slot) => slot.visual === "vacia");
  const merged = [...occupied, ...vacias].slice(0, capacity);

  while (merged.length < capacity) {
    merged.push({
      slotNumber: merged.length + 1,
      idUbicacion: null,
      codigo: null,
      visual: "vacia",
      productoLabel: null,
      detalle: null,
    });
  }

  return merged.map((slot, index) => ({
    ...slot,
    slotNumber: index + 1,
  }));
}

export function buildProcesamientoEnriquecimientoByUbicacion(
  params: ProcesamientoZonaParams,
): Map<string, ProcesamientoSlotEnriquecimiento> {
  const { solicitudesOperador, solicitudesDb, ordenes, warehouseRows } = params;

  const operadorById = new Map(
    solicitudesOperador
      .filter((s) => isSolicitudActivaEnProcesamiento(s.estado))
      .map((s) => [s.idSolicitudProcesamiento, s]),
  );

  const dbById = new Map(
    solicitudesDb
      .filter((s) => isSolicitudActivaEnProcesamiento(s.estado))
      .map((s) => [s.id_solicitud_procesamiento, s]),
  );

  const enriquecimientoByUbicacion = new Map<
    string,
    ProcesamientoSlotEnriquecimiento
  >();

  const setEnriquecimiento = (idUbicacion: string, idSolicitud: string) => {
    const operador = operadorById.get(idSolicitud);
    const db = dbById.get(idSolicitud);
    if (!operador || !db) return;

    const sobranteRaw = parsePositiveNumber(db.sobrante_kg);
    enriquecimientoByUbicacion.set(idUbicacion, {
      idSolicitud,
      estado: operador.estado,
      ordenCodigo: operador.orden,
      primarioNombre: operador.primario,
      resultadoNombre: operador.secundario,
      sobranteKg: solicitudTieneSobrantePendiente(sobranteRaw)
        ? sobranteRaw
        : null,
      unidadesSecundario:
        parsePositiveNumber(db.kilos_secundario) ??
        parsePositiveNumber(operador.estimSecundario),
    });
  };

  for (const orden of ordenes) {
    if (orden.tipoFlujo !== "a_procesamiento") continue;

    const idUbicacion = orden.idUbicacionDestino?.trim();
    if (!idUbicacion) continue;

    const idSolicitud = parseProcesamientoSolicitudRef(orden.observaciones);
    if (!idSolicitud) continue;

    if (operadorById.has(idSolicitud)) {
      setEnriquecimiento(idUbicacion, idSolicitud);
    }
  }

  const stockByUbicacion = new Map<string, WarehouseStateRow[]>();
  for (const row of warehouseRows) {
    const cantidad = Number.parseFloat(row.cantidad || "0");
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue;

    const current = stockByUbicacion.get(row.id_ubicacion) ?? [];
    current.push(row);
    stockByUbicacion.set(row.id_ubicacion, current);
  }

  for (const [idUbicacion, rows] of stockByUbicacion) {
    if (enriquecimientoByUbicacion.has(idUbicacion)) continue;

    const productIds = new Set(rows.map((row) => row.id_producto));
    const matches = solicitudesDb.filter(
      (solicitud) =>
        isSolicitudActivaEnProcesamiento(solicitud.estado) &&
        productIds.has(solicitud.id_producto_primario),
    );

    if (matches.length !== 1) continue;

    setEnriquecimiento(idUbicacion, matches[0]!.id_solicitud_procesamiento);
  }

  return enriquecimientoByUbicacion;
}

function buildSobranteSlot(
  base: EstadoBodegaSlot,
  meta: ProcesamientoSlotEnriquecimiento,
): EstadoBodegaSlot {
  const baseDetalle = base.detalle!;

  return {
    ...base,
    visual: "ocupada_primario",
    productoLabel: meta.primarioNombre,
    detalle: {
      ...baseDetalle,
      productoNombre: meta.primarioNombre,
      idPaquete: meta.ordenCodigo,
      cantidad: formatKilos(meta.sobranteKg),
      rolProcesamiento: "sobrante",
      resultadoNombre: null,
      sobranteKg: meta.sobranteKg,
    },
  };
}

function buildResultadoSlot(
  base: EstadoBodegaSlot,
  meta: ProcesamientoSlotEnriquecimiento,
): EstadoBodegaSlot {
  const baseDetalle = base.detalle;
  const cantidad =
    meta.unidadesSecundario != null
      ? `${formatUnidades(meta.unidadesSecundario)} ud.`
      : (baseDetalle?.cantidad ?? "—");

  const detalle: EstadoBodegaSlotDetalleView = {
    productoNombre: meta.resultadoNombre,
    idPaquete: meta.ordenCodigo,
    cliente: baseDetalle?.cliente ?? null,
    cantidad,
    posicion: baseDetalle?.posicion ?? base.codigo,
    temperatura: baseDetalle?.temperatura ?? null,
    ordenCompraCodigo: baseDetalle?.ordenCompraCodigo ?? null,
    resultadoNombre: meta.resultadoNombre,
    rolProcesamiento: "procesado",
    sobranteKg: null,
  };

  return {
    slotNumber: 0,
    idUbicacion: base.idUbicacion,
    codigo: base.codigo,
    visual: "ocupada_procesado",
    productoLabel: meta.resultadoNombre,
    detalle,
  };
}

function splitProcesamientoDualCajas(
  section: EstadoBodegaSectionView,
  enriquecimientoByUbicacion: Map<string, ProcesamientoSlotEnriquecimiento>,
): EstadoBodegaSectionView {
  const ubicacionesExpandidas = new Set<string>();
  const expanded: EstadoBodegaSlot[] = [];

  for (const slot of section.slots) {
    if (slot.visual === "vacia" || !slot.idUbicacion || !slot.detalle) {
      if (slot.visual === "vacia") expanded.push(slot);
      continue;
    }

    const meta = enriquecimientoByUbicacion.get(slot.idUbicacion);

    if (!meta || meta.estado !== "pendiente_cierre") {
      expanded.push(
        meta
          ? {
              ...slot,
              detalle: {
                ...slot.detalle,
                resultadoNombre: meta.resultadoNombre,
                sobranteKg: null,
                rolProcesamiento: "en_proceso",
              },
            }
          : slot,
      );
      continue;
    }

    if (ubicacionesExpandidas.has(slot.idUbicacion)) continue;
    ubicacionesExpandidas.add(slot.idUbicacion);

    if (meta.sobranteKg) {
      expanded.push(buildSobranteSlot(slot, meta));
    }
    expanded.push(buildResultadoSlot(slot, meta));
  }

  const slots = padProcesamientoSlots(expanded, section.capacity);
  const occupiedCount = slots.filter((slot) => slot.visual !== "vacia").length;

  return {
    ...section,
    slots,
    occupiedCount,
  };
}

/** Aplica enriquecimiento y, en pendiente_cierre, dos cajas (sobrante + resultado). */
export function applyProcesamientoZonaLayout(
  layout: EstadoBodegaLayoutView,
  params: ProcesamientoZonaParams,
): EstadoBodegaLayoutView {
  const enriquecimiento = buildProcesamientoEnriquecimientoByUbicacion(params);

  return {
    sections: layout.sections.map((section) => {
      if (section.id !== "procesamiento") return section;
      return splitProcesamientoDualCajas(section, enriquecimiento);
    }),
  };
}

export function buildResultadoByUbicacionProcesamiento(
  params: ProcesamientoZonaParams,
): Map<string, string> {
  const enriquecimiento = buildProcesamientoEnriquecimientoByUbicacion(params);
  return new Map(
    [...enriquecimiento.entries()].map(([id, meta]) => [
      id,
      meta.resultadoNombre,
    ]),
  );
}

/** @deprecated Usar applyProcesamientoZonaLayout */
export function enrichProcesamientoSlotDetalles(
  layout: EstadoBodegaLayoutView,
  enriquecimientoByUbicacion: Map<string, ProcesamientoSlotEnriquecimiento>,
): EstadoBodegaLayoutView {
  if (enriquecimientoByUbicacion.size === 0) return layout;

  return {
    sections: layout.sections.map((section) => {
      if (section.id !== "procesamiento") return section;
      return splitProcesamientoDualCajas(section, enriquecimientoByUbicacion);
    }),
  };
}

export async function loadProcesamientoZonaParams(params: {
  codigoCuenta: string;
  idBodega: string;
  warehouseRows: WarehouseStateRow[];
}): Promise<ProcesamientoZonaParams> {
  const { codigoCuenta, idBodega, warehouseRows } = params;

  const [solicitudesOperador, solicitudesDb, ordenes] = await Promise.all([
    listSolicitudesProcesamientoOperador({ codigoCuenta, idBodega }).catch(
      () => [],
    ),
    listSolicitudesProcesamiento({ codigoCuenta, idBodega }).catch(() => []),
    listOrdenesTrabajoApi({ codigoCuenta, idBodega }).catch(() => []),
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
