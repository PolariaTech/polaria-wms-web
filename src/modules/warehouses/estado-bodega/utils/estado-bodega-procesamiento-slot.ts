import { listOrdenesTrabajoApi } from "@/modules/operations";
import type { OrdenTrabajoApiRow } from "@/modules/operations";
import {
  listSolicitudesProcesamiento,
  listSolicitudesProcesamientoOperador,
} from "@/modules/processing";
import {
  parseRolDevolucionProcesamiento,
  solicitudTieneSobrantePendiente,
} from "@/modules/processing/shared/constants/procesamiento-post-cierre";
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
  /** False cuando la OT de resultado ya está completada. */
  resultadoPendiente: boolean;
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

function cantidadWarehousePositive(value: string | null | undefined): boolean {
  const parsed = Number.parseFloat(value || "0");
  return Number.isFinite(parsed) && parsed > 0;
}

function tieneStockProductoEnUbicacion(
  warehouseRows: WarehouseStateRow[],
  idUbicacion: string,
  idProducto: string,
): boolean {
  return warehouseRows.some(
    (row) =>
      row.id_ubicacion === idUbicacion &&
      row.id_producto === idProducto &&
      cantidadWarehousePositive(row.cantidad),
  );
}

function ordenEstadoCompletada(estado: string | null | undefined): boolean {
  const normalized = estado?.trim().toLowerCase();
  return normalized === "completada" || normalized === "completado";
}

/** Sobrante ya ubicado vía OT post-cierre (o Bodega→Bodega etiquetada). */
function sobranteYaDevueltoEnOrdenes(
  ordenes: OrdenTrabajoApiRow[],
  idSolicitud: string,
): boolean {
  return ordenes.some((orden) => {
    if (!ordenEstadoCompletada(orden.estado)) return false;
    if (parseProcesamientoSolicitudRef(orden.observaciones) !== idSolicitud) {
      return false;
    }
    return (
      parseRolDevolucionProcesamiento(orden.observaciones) === "desperdicio"
    );
  });
}

/** Resultado ya ubicado en almacenamiento. */
function resultadoYaUbicadoEnOrdenes(
  ordenes: OrdenTrabajoApiRow[],
  idSolicitud: string,
): boolean {
  return ordenes.some((orden) => {
    if (!ordenEstadoCompletada(orden.estado)) return false;
    if (parseProcesamientoSolicitudRef(orden.observaciones) !== idSolicitud) {
      return false;
    }
    return (
      parseRolDevolucionProcesamiento(orden.observaciones) === "procesado"
    );
  });
}

/**
 * Solo mostrar caja Sobrante si aún hay primario en el slot de procesamiento
 * y no existe OT de devolución de desperdicio ya completada.
 */
function resolveSobranteKgPendienteEnMapa(params: {
  sobranteRaw: number | null;
  idSolicitud: string;
  idUbicacion: string;
  idProductoPrimario: string;
  warehouseRows: WarehouseStateRow[];
  ordenes: OrdenTrabajoApiRow[];
}): number | null {
  const {
    sobranteRaw,
    idSolicitud,
    idUbicacion,
    idProductoPrimario,
    warehouseRows,
    ordenes,
  } = params;

  if (!solicitudTieneSobrantePendiente(sobranteRaw)) return null;
  if (sobranteYaDevueltoEnOrdenes(ordenes, idSolicitud)) return null;
  if (
    !tieneStockProductoEnUbicacion(
      warehouseRows,
      idUbicacion,
      idProductoPrimario,
    )
  ) {
    return null;
  }

  return sobranteRaw;
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
    const idProductoPrimario = db.id_producto_primario?.trim() ?? "";

    enriquecimientoByUbicacion.set(idUbicacion, {
      idSolicitud,
      estado: operador.estado,
      ordenCodigo: operador.orden,
      primarioNombre: operador.primario,
      resultadoNombre: operador.secundario,
      sobranteKg: idProductoPrimario
        ? resolveSobranteKgPendienteEnMapa({
            sobranteRaw,
            idSolicitud,
            idUbicacion,
            idProductoPrimario,
            warehouseRows,
            ordenes,
          })
        : solicitudTieneSobrantePendiente(sobranteRaw)
          ? sobranteRaw
          : null,
      resultadoPendiente: !resultadoYaUbicadoEnOrdenes(ordenes, idSolicitud),
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
    lockedBy: baseDetalle?.lockedBy ?? null,
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

  const pushCajasPendienteCierre = (
    base: EstadoBodegaSlot,
    meta: ProcesamientoSlotEnriquecimiento,
    options?: { keepResidualStock?: boolean },
  ) => {
    if (!base.idUbicacion || ubicacionesExpandidas.has(base.idUbicacion)) {
      return;
    }
    ubicacionesExpandidas.add(base.idUbicacion);

    const before = expanded.length;
    if (meta.sobranteKg) {
      expanded.push(buildSobranteSlot(base, meta));
    }
    if (meta.resultadoPendiente) {
      expanded.push(buildResultadoSlot(base, meta));
    }

    // Ambas cajas ya ubicadas: mostrar solo stock físico residual (si queda).
    if (
      options?.keepResidualStock &&
      expanded.length === before &&
      base.visual !== "vacia" &&
      base.detalle
    ) {
      expanded.push(base);
    }
  };

  for (const slot of section.slots) {
    const meta = slot.idUbicacion
      ? enriquecimientoByUbicacion.get(slot.idUbicacion)
      : undefined;

    // Slot físico vacío, pero sigue en pendiente_cierre: mantener Resultado
    // (y Sobrante solo si aún hay primario en mapa).
    if (slot.visual === "vacia" || !slot.detalle) {
      if (meta?.estado === "pendiente_cierre" && slot.idUbicacion) {
        const syntheticBase: EstadoBodegaSlot = {
          ...slot,
          visual: "ocupada_procesado",
          productoLabel: meta.resultadoNombre,
          detalle: {
            productoNombre: meta.resultadoNombre,
            idPaquete: meta.ordenCodigo,
            cliente: null,
            cantidad: "—",
            posicion: slot.codigo,
            temperatura: null,
            ordenCompraCodigo: null,
            lockedBy: null,
          },
        };
        pushCajasPendienteCierre(syntheticBase, meta);
        continue;
      }

      if (slot.visual === "vacia") expanded.push(slot);
      continue;
    }

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

    pushCajasPendienteCierre(slot, meta, { keepResidualStock: true });
  }

  const slots = padProcesamientoSlots(expanded, section.capacity);
  const occupiedCount = slots.filter((slot) => slot.visual !== "vacia").length;

  return {
    ...section,
    slots,
    occupiedCount,
  };
}

/** Marca en almacenamiento los slots con producto secundario (resultado) en azul. */
export function applyResultadoVisualEnAlmacenamiento(
  layout: EstadoBodegaLayoutView,
  params: ProcesamientoZonaParams,
): EstadoBodegaLayoutView {
  const secundarioIds = new Set(
    params.solicitudesDb
      .map((solicitud) => solicitud.id_producto_secundario?.trim())
      .filter((id): id is string => Boolean(id)),
  );

  if (secundarioIds.size === 0) return layout;

  const stockByUbicacion = new Map<string, WarehouseStateRow[]>();
  for (const row of params.warehouseRows) {
    const cantidad = Number.parseFloat(row.cantidad || "0");
    if (!Number.isFinite(cantidad) || cantidad <= 0) continue;
    const current = stockByUbicacion.get(row.id_ubicacion) ?? [];
    current.push(row);
    stockByUbicacion.set(row.id_ubicacion, current);
  }

  return {
    sections: layout.sections.map((section) => {
      if (section.id !== "almacenamiento") return section;

      return {
        ...section,
        slots: section.slots.map((slot) => {
          if (slot.visual === "vacia" || !slot.idUbicacion || !slot.detalle) {
            return slot;
          }

          const rows = stockByUbicacion.get(slot.idUbicacion) ?? [];
          if (rows.length === 0) return slot;

          const esResultado = rows.every((row) =>
            secundarioIds.has(row.id_producto),
          );
          if (!esResultado) return slot;

          return {
            ...slot,
            visual: "ocupada_procesado",
          };
        }),
      };
    }),
  };
}

/** Aplica enriquecimiento y, en pendiente_cierre, dos cajas (sobrante + resultado). */
export function applyProcesamientoZonaLayout(
  layout: EstadoBodegaLayoutView,
  params: ProcesamientoZonaParams,
): EstadoBodegaLayoutView {
  const enriquecimiento = buildProcesamientoEnriquecimientoByUbicacion(params);

  const withProcesamiento = {
    sections: layout.sections.map((section) => {
      if (section.id !== "procesamiento") return section;
      return splitProcesamientoDualCajas(section, enriquecimiento);
    }),
  };

  return applyResultadoVisualEnAlmacenamiento(withProcesamiento, params);
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
