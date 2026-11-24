import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type { EstadoBodegaLayoutView } from "../types/estado-bodega.types";
import {
  type ProcesamientoSlotEnriquecimiento,
  type ProcesamientoZonaParams,
} from "./estado-bodega-procesamiento-slot.shared";
import {
  buildProcesamientoEnriquecimientoByUbicacion,
  splitProcesamientoDualCajas,
} from "./estado-bodega-procesamiento-slot.build";

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
