import {
  ESTADO_BODEGA_SECTIONS,
  type EstadoBodegaSectionId,
} from "../constants/estado-bodega-layout";
import type {
  EstadoBodegaLayoutView,
  EstadoBodegaSectionView,
  EstadoBodegaSlot,
  UbicacionEstadoBodegaDbRow,
} from "../types/estado-bodega.types";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import { buildSlotDetalleFromRows } from "./estado-bodega-slot-content";

interface UbicacionNormalizada {
  idUbicacion: string;
  codigo: string;
  estadoSlot: string;
  esRecepcion: boolean;
  esAlmacenamiento: boolean;
  esPicking: boolean;
  tipoCodigo: string;
}

function resolveTipoUbicacion(
  value: UbicacionEstadoBodegaDbRow["tipo_ubicacion"],
): UbicacionEstadoBodegaDbRow["tipo_ubicacion"] extends infer T
  ? T extends (infer U)[]
    ? U | null
    : T
  : null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeUbicacion(row: UbicacionEstadoBodegaDbRow): UbicacionNormalizada {
  const tipo = resolveTipoUbicacion(row.tipo_ubicacion);

  return {
    idUbicacion: row.id_ubicacion,
    codigo: row.codigo,
    estadoSlot: row.estado_slot ?? "libre",
    esRecepcion: Boolean(tipo?.es_recepcion),
    esAlmacenamiento: Boolean(tipo?.es_almacenamiento),
    esPicking: Boolean(tipo?.es_picking),
    tipoCodigo: tipo?.codigo?.toUpperCase() ?? "",
  };
}

function resolveSectionId(ubicacion: UbicacionNormalizada): EstadoBodegaSectionId {
  if (ubicacion.esRecepcion || ubicacion.tipoCodigo === "INGRESO") {
    return "entrada";
  }

  if (ubicacion.esPicking || ubicacion.tipoCodigo.includes("SALIDA")) {
    return "salida";
  }

  if (
    ubicacion.estadoSlot === "en_proceso" ||
    ubicacion.tipoCodigo.includes("PROCES")
  ) {
    return "procesamiento";
  }

  return "almacenamiento";
}

function resolveSlotVisual(
  ubicacion: UbicacionNormalizada,
  hasStock: boolean,
): EstadoBodegaSlot["visual"] {
  if (!hasStock) {
    return "vacia";
  }

  if (
    ubicacion.estadoSlot === "en_proceso" ||
    ubicacion.tipoCodigo.includes("PROCES")
  ) {
    return "ocupada_procesado";
  }

  return "ocupada_primario";
}

function buildEmptySlots(
  capacity: number,
  startNumber = 1,
): EstadoBodegaSlot[] {
  return Array.from({ length: capacity }, (_, index) => ({
    slotNumber: startNumber + index,
    idUbicacion: null,
    codigo: null,
    visual: "vacia" as const,
    productoLabel: null,
    detalle: null,
  }));
}

function padSectionSlots(
  slots: EstadoBodegaSlot[],
  capacity: number,
): EstadoBodegaSlot[] {
  if (slots.length >= capacity) {
    return slots.slice(0, capacity).map((slot, index) => ({
      ...slot,
      slotNumber: index + 1,
    }));
  }

  const padded = [...slots];
  while (padded.length < capacity) {
    padded.push({
      slotNumber: padded.length + 1,
      idUbicacion: null,
      codigo: null,
      visual: "vacia",
      productoLabel: null,
      detalle: null,
    });
  }

  return padded;
}

export function mapEstadoBodegaLayout(
  ubicaciones: UbicacionEstadoBodegaDbRow[],
  warehouseRows: WarehouseStateRow[],
): EstadoBodegaLayoutView {
  const stockByUbicacion = new Map<string, WarehouseStateRow[]>();

  for (const row of warehouseRows) {
    const current = stockByUbicacion.get(row.id_ubicacion) ?? [];
    current.push(row);
    stockByUbicacion.set(row.id_ubicacion, current);
  }

  const grouped = new Map<EstadoBodegaSectionId, EstadoBodegaSlot[]>(
    ESTADO_BODEGA_SECTIONS.map((section) => [section.id, []]),
  );

  const normalized = ubicaciones.map(normalizeUbicacion).sort((a, b) =>
    a.codigo.localeCompare(b.codigo, "es"),
  );

  for (const ubicacion of normalized) {
    const sectionId = resolveSectionId(ubicacion);
    const stockRows = stockByUbicacion.get(ubicacion.idUbicacion) ?? [];
    const activeStockRows = stockRows.filter((row) => {
      const cantidad = Number.parseFloat(row.cantidad || "0");
      return Number.isFinite(cantidad) && cantidad > 0;
    });
    const hasStock = activeStockRows.length > 0;
    const visual = resolveSlotVisual(ubicacion, hasStock);

    const detalle =
      visual === "vacia"
        ? null
        : buildSlotDetalleFromRows(activeStockRows, ubicacion.codigo);

    grouped.get(sectionId)?.push({
      slotNumber: (grouped.get(sectionId)?.length ?? 0) + 1,
      idUbicacion: ubicacion.idUbicacion,
      codigo: ubicacion.codigo,
      visual,
      productoLabel: detalle?.productoNombre ?? null,
      detalle,
    });
  }

  const sections: EstadoBodegaSectionView[] = ESTADO_BODEGA_SECTIONS.map(
    (section) => {
      const sectionSlots = padSectionSlots(
        grouped.get(section.id) ?? buildEmptySlots(0),
        section.capacity,
      );

      const occupiedCount = sectionSlots.filter(
        (slot) => slot.visual !== "vacia",
      ).length;

      return {
        id: section.id,
        title: section.title,
        cols: section.cols,
        rows: section.rows,
        capacity: section.capacity,
        occupiedCount,
        alertCount: 0,
        pendingTaskCount: 0,
        emptyHint: section.emptyHint,
        showOccupancyBadge: section.showOccupancyBadge,
        slots: sectionSlots,
      };
    },
  );

  return { sections };
}
