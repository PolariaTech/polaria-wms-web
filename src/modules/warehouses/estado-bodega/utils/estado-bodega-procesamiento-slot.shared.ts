import type { OrdenTrabajoApiRow } from "@/modules/operations";
import {
  parseRolDevolucionProcesamiento,
  solicitudTieneSobrantePendiente,
} from "@/modules/processing/shared/constants/procesamiento-post-cierre";
import {
  parseProcesamientoSolicitudRef,
} from "@/modules/processing/shared/constants/procesamiento-solicitud-ref";
import type {
  EstadoProcesamiento,
  SolicitudProcesamientoOperadorRow,
  SolicitudProcesamientoRow,
} from "@/modules/processing/shared/types/processing.types";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type { EstadoBodegaSlot } from "../types/estado-bodega.types";

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

export function isSolicitudActivaEnProcesamiento(
  estado: EstadoProcesamiento,
): boolean {
  return ESTADOS_ACTIVOS_PROCESAMIENTO.has(estado);
}

export function parsePositiveNumber(
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
export function resultadoYaUbicadoEnOrdenes(
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
export function resolveSobranteKgPendienteEnMapa(params: {
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

export function padProcesamientoSlots(
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
