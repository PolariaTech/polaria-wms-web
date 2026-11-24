import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import { formatKilos } from "@/modules/processing/shared/constants/processing-status";
import type { ProcesamientoSlotEnriquecimiento } from "@/modules/warehouses/estado-bodega/utils/estado-bodega-procesamiento-slot";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import {
  formatCantidadSlot,
  formatTemperaturaSlot,
  resolveOrdenCompraCodigo,
  resolveProductoNombre,
} from "@/modules/warehouses/estado-bodega/utils/estado-bodega-slot-content";
import type { JefeBodegaSlotPickerOption } from "./JefeBodegaSlotPickerModal";
import type { OrigenMeta } from "./jefe-bodega-transferencia-modal.types";

export function buildTransferenciaSlotNumberById(
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[],
  ubicacionesProcesamiento: UbicacionEstadoBodegaDbRow[],
): Map<string, number> {
  const map = new Map<string, number>();
  [...ubicacionesAlmacen]
    .sort((a, b) => a.codigo.localeCompare(b.codigo, "es"))
    .forEach((u, i) => map.set(u.id_ubicacion, i + 1));
  [...ubicacionesProcesamiento]
    .sort((a, b) => a.codigo.localeCompare(b.codigo, "es"))
    .forEach((u, i) => map.set(u.id_ubicacion, i + 1));
  return map;
}

interface OrigenAlmacenOptionsParams {
  warehouseStock: WarehouseStateRow[];
  almacenIds: Set<string>;
  ubicacionesDisponiblesIds: Set<string>;
  codigoByUbicacion: Map<string, string>;
  slotNumberById: Map<string, number>;
}

export function buildOrigenAlmacenOptions({
  warehouseStock,
  almacenIds,
  ubicacionesDisponiblesIds,
  codigoByUbicacion,
  slotNumberById,
}: OrigenAlmacenOptionsParams): JefeBodegaSlotPickerOption[] {
  const seen = new Set<string>();
  const options: JefeBodegaSlotPickerOption[] = [];

  for (const row of warehouseStock) {
    if (!almacenIds.has(row.id_ubicacion)) continue;
    if (!ubicacionesDisponiblesIds.has(row.id_ubicacion)) continue;
    if (Number.parseFloat(row.cantidad || "0") <= 0) continue;
    if (seen.has(row.id_ubicacion)) continue;
    seen.add(row.id_ubicacion);

    const codigoSlot = codigoByUbicacion.get(row.id_ubicacion) ?? "Slot";
    const nombre = resolveProductoNombre(row) ?? "Producto";
    const orden = resolveOrdenCompraCodigo(row);
    const temp = formatTemperaturaSlot(row.temperatura);

    options.push({
      id: `alm:${row.id_ubicacion}`,
      title: `${codigoSlot} — ${nombre}`,
      subtitle: orden,
      meta: temp,
      slotNumber: slotNumberById.get(row.id_ubicacion) ?? 1,
      codigo: codigoSlot,
      visual: "ocupada_primario",
      detalle: {
        productoNombre: nombre,
        idPaquete: orden,
        cliente: null,
        cantidad: formatCantidadSlot(row.cantidad),
        posicion: codigoSlot,
        temperatura: temp,
        ordenCompraCodigo: orden,
        lockedBy: null,
      },
    });
  }

  return options;
}

interface OrigenProcesamientoOptionsParams {
  enriquecimientoProc: Map<string, ProcesamientoSlotEnriquecimiento>;
  procIds: Set<string>;
  bloqueadas: Set<string>;
  codigoByUbicacion: Map<string, string>;
  slotNumberById: Map<string, number>;
  warehouseStock: WarehouseStateRow[];
}

export function buildOrigenProcesamientoOptions({
  enriquecimientoProc,
  procIds,
  bloqueadas,
  codigoByUbicacion,
  slotNumberById,
  warehouseStock,
}: OrigenProcesamientoOptionsParams): JefeBodegaSlotPickerOption[] {
  const options: JefeBodegaSlotPickerOption[] = [];
  const covered = new Set<string>();

  for (const [idUbicacion, meta] of enriquecimientoProc) {
    if (!procIds.has(idUbicacion) || bloqueadas.has(idUbicacion)) continue;
    covered.add(idUbicacion);
    const codigoSlot = codigoByUbicacion.get(idUbicacion) ?? "PROC";

    if (meta.estado === "pendiente_cierre" && meta.sobranteKg) {
      options.push({
        id: `proc:${idUbicacion}:sobrante`,
        title: `${codigoSlot} — ${meta.primarioNombre}`,
        subtitle: `${meta.ordenCodigo} · Sobrante`,
        meta: formatKilos(meta.sobranteKg),
        slotNumber: slotNumberById.get(idUbicacion) ?? 1,
        codigo: codigoSlot,
        visual: "ocupada_primario",
        detalle: {
          productoNombre: meta.primarioNombre,
          idPaquete: meta.ordenCodigo,
          cliente: null,
          cantidad: formatKilos(meta.sobranteKg),
          posicion: codigoSlot,
          temperatura: null,
          ordenCompraCodigo: null,
          lockedBy: null,
          rolProcesamiento: "sobrante",
          sobranteKg: meta.sobranteKg,
        },
      });
    }

    if (meta.estado === "pendiente_cierre" || meta.estado === "en_proceso") {
      const units =
        meta.unidadesSecundario != null
          ? `${meta.unidadesSecundario.toLocaleString("es-CL")} ud.`
          : null;
      const isCierre = meta.estado === "pendiente_cierre";

      options.push({
        id: `proc:${idUbicacion}:${isCierre ? "procesado" : "en_proceso"}`,
        title: `${codigoSlot} — ${meta.resultadoNombre}`,
        subtitle: `${meta.ordenCodigo} · ${isCierre ? "Resultado" : "En proceso"}`,
        meta: units,
        slotNumber: slotNumberById.get(idUbicacion) ?? 1,
        codigo: codigoSlot,
        visual: "ocupada_procesado",
        detalle: {
          productoNombre: meta.resultadoNombre,
          idPaquete: meta.ordenCodigo,
          cliente: null,
          cantidad: units ?? "—",
          posicion: codigoSlot,
          temperatura: null,
          ordenCompraCodigo: null,
          lockedBy: null,
          rolProcesamiento: isCierre ? "procesado" : "en_proceso",
        },
      });
    }
  }

  for (const row of warehouseStock) {
    if (!procIds.has(row.id_ubicacion) || covered.has(row.id_ubicacion)) {
      continue;
    }
    if (bloqueadas.has(row.id_ubicacion)) continue;
    if (Number.parseFloat(row.cantidad || "0") <= 0) continue;

    const codigoSlot = codigoByUbicacion.get(row.id_ubicacion) ?? "PROC";
    const nombre = resolveProductoNombre(row) ?? "Producto";
    options.push({
      id: `proc:${row.id_ubicacion}:stock`,
      title: `${codigoSlot} — ${nombre}`,
      subtitle: resolveOrdenCompraCodigo(row),
      meta: formatTemperaturaSlot(row.temperatura),
      slotNumber: slotNumberById.get(row.id_ubicacion) ?? 1,
      codigo: codigoSlot,
      visual: "ocupada_procesado",
      detalle: {
        productoNombre: nombre,
        idPaquete: resolveOrdenCompraCodigo(row),
        cliente: null,
        cantidad: formatCantidadSlot(row.cantidad),
        posicion: codigoSlot,
        temperatura: formatTemperaturaSlot(row.temperatura),
        ordenCompraCodigo: resolveOrdenCompraCodigo(row),
        lockedBy: null,
      },
    });
  }

  return options;
}

export function buildTransferenciaDestinoOptions(
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[],
  origenMeta: OrigenMeta | null,
): JefeBodegaSlotPickerOption[] {
  return ubicacionesAlmacen.map((ubicacion, index) => {
    const libre =
      (ubicacion.estado_slot?.toLowerCase() ?? "libre") === "libre";
    const isOrigen =
      ubicacion.id_ubicacion === origenMeta?.idUbicacion &&
      origenMeta.zona === "almacenamiento";

    return {
      id: ubicacion.id_ubicacion,
      title: ubicacion.codigo,
      subtitle: isOrigen
        ? "Casillero de origen"
        : libre
          ? "Casillero libre"
          : `Estado: ${ubicacion.estado_slot}`,
      slotNumber: index + 1,
      codigo: ubicacion.codigo,
      disabled: isOrigen,
      visual: libre ? "vacia" : "ocupada_primario",
      detalle: libre
        ? null
        : {
            productoNombre: ubicacion.codigo,
            idPaquete: null,
            cliente: null,
            cantidad: "—",
            posicion: ubicacion.codigo,
            temperatura: null,
            ordenCompraCodigo: null,
            lockedBy: null,
          },
    };
  });
}
