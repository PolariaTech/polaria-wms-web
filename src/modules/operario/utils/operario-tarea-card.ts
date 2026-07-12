import type { FlujoOrdenTrabajoApi } from "@/modules/operations";
import type { TipoTarea } from "@/modules/processing/shared/types/processing.types";
import type { OperarioTareaView } from "../types/operario-tarea.types";

export interface OperarioTareaFlowView {
  sourceLabel: string;
  sourceValue: string;
  destinationLabel: string;
  destinationValue: string;
  typeLabel: string;
}

const TIPO_LABELS: Record<TipoTarea, string> = {
  ingreso: "Ingreso",
  movimiento: "Movimiento interno",
  despacho: "Salida",
  procesamiento: "Procesamiento",
  revision: "Revisión",
  otro: "Otro",
};

const FLUJO_LABELS: Record<FlujoOrdenTrabajoApi, string> = {
  a_bodega: "Ingreso",
  bodega_a_bodega: "Movimiento interno",
  revisar: "Revisión",
  a_salida: "Salida",
};

function parseFlowValues(text: string): { from: string; to: string } | null {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const arrow = normalized.match(/^(.+?)\s*(?:→|->)\s*(.+)$/u);
  if (arrow) {
    return { from: arrow[1].trim(), to: arrow[2].trim() };
  }

  const deA = normalized.match(/\bde\s+(.+?)\s+a(?:l)?\s+(.+)$/iu);
  if (deA) {
    return { from: deA[1].trim(), to: deA[2].trim() };
  }

  return null;
}

export function formatOperarioTipoTarea(tipo: TipoTarea): string {
  return TIPO_LABELS[tipo] ?? tipo;
}

function resolveTypeLabel(tarea: OperarioTareaView): string {
  if (tarea.tipoFlujo) {
    return FLUJO_LABELS[tarea.tipoFlujo];
  }
  return formatOperarioTipoTarea(tarea.tipo);
}

function resolveFromEnrichedOrden(tarea: OperarioTareaView): OperarioTareaFlowView | null {
  if (!tarea.tipoFlujo) return null;

  switch (tarea.tipoFlujo) {
    case "a_bodega":
      return {
        sourceLabel: "Origen",
        sourceValue: tarea.origenCodigo ?? "—",
        destinationLabel: "Destino",
        destinationValue: tarea.destinoCodigo ?? "—",
        typeLabel: FLUJO_LABELS.a_bodega,
      };
    case "bodega_a_bodega":
      return {
        sourceLabel: "Origen",
        sourceValue: tarea.origenCodigo ?? "—",
        destinationLabel: "Destino",
        destinationValue: tarea.destinoCodigo ?? "—",
        typeLabel: FLUJO_LABELS.bodega_a_bodega,
      };
    case "revisar": {
      const slot = tarea.origenCodigo ?? tarea.destinoCodigo ?? "—";
      return {
        sourceLabel: "Origen",
        sourceValue: slot,
        destinationLabel: "Destino",
        destinationValue: slot,
        typeLabel: FLUJO_LABELS.revisar,
      };
    }
    case "a_salida":
      return {
        sourceLabel: "Origen",
        sourceValue: tarea.origenCodigo ?? "—",
        destinationLabel: "Salida",
        destinationValue: tarea.destinoCodigo ?? "Asignación automática",
        typeLabel: FLUJO_LABELS.a_salida,
      };
    default:
      return null;
  }
}

export function resolveOperarioTareaFlow(
  tarea: OperarioTareaView,
): OperarioTareaFlowView {
  const fromOrden = resolveFromEnrichedOrden(tarea);
  if (fromOrden) {
    return fromOrden;
  }

  const typeLabel = resolveTypeLabel(tarea);

  if (tarea.origenCodigo || tarea.destinoCodigo) {
    return {
      sourceLabel: "Origen",
      sourceValue: tarea.origenCodigo ?? "—",
      destinationLabel: "Destino",
      destinationValue: tarea.destinoCodigo ?? "—",
      typeLabel,
    };
  }

  const parsed =
    parseFlowValues(tarea.descripcion?.trim() ?? "") ??
    parseFlowValues(tarea.titulo?.trim() ?? "");

  if (parsed) {
    return {
      sourceLabel: "Origen",
      sourceValue: parsed.from,
      destinationLabel: "Destino",
      destinationValue: parsed.to,
      typeLabel,
    };
  }

  if (tarea.tipo === "revision") {
    const slot = tarea.titulo?.trim() || tarea.descripcion?.trim() || "—";
    return {
      sourceLabel: "Origen",
      sourceValue: slot,
      destinationLabel: "Destino",
      destinationValue: slot,
      typeLabel: "Revisión",
    };
  }

  return {
    sourceLabel: "Origen",
    sourceValue: tarea.titulo?.trim() || "—",
    destinationLabel: "Destino",
    destinationValue: tarea.descripcion?.trim() || "—",
    typeLabel,
  };
}
