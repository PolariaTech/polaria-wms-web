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
  if (!hasStock && ubicacion.estadoSlot === "libre") {
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
    });
  }

  return padded;
}

function buildStockLabel(
  warehouseRows: WarehouseStateRow[],
  idUbicacion: string,
): string | null {
  const rows = warehouseRows.filter((row) => row.id_ubicacion === idUbicacion);
  if (rows.length === 0) return null;

  const total = rows.reduce(
    (sum, row) => sum + Number.parseFloat(row.cantidad || "0"),
    0,
  );

  if (!Number.isFinite(total) || total <= 0) {
    return rows.length > 1 ? `${rows.length} ítems` : "Ocupada";
  }

  return `${total.toLocaleString("es-CL", { maximumFractionDigits: 2 })} kg`;
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
    const hasStock = stockRows.length > 0 || ubicacion.estadoSlot !== "libre";
    const visual = resolveSlotVisual(ubicacion, hasStock);

    grouped.get(sectionId)?.push({
      slotNumber: (grouped.get(sectionId)?.length ?? 0) + 1,
      idUbicacion: ubicacion.idUbicacion,
      codigo: ubicacion.codigo,
      visual,
      productoLabel:
        visual === "vacia"
          ? null
          : buildStockLabel(warehouseRows, ubicacion.idUbicacion),
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
