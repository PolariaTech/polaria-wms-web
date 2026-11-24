import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type { UbicacionEstadoBodegaDbRow } from "@/modules/warehouses/estado-bodega/types/estado-bodega.types";
import {
  formatCantidadSlot,
  formatTemperaturaSlot,
  resolveOrdenCompraCodigo,
  resolveProductoNombre,
} from "@/modules/warehouses/estado-bodega/utils/estado-bodega-slot-content";
import type { JefeBodegaSlotPickerOption } from "./JefeBodegaSlotPickerModal";

export function buildIngresoDestinoOptions(
  ubicacionesAlmacen: UbicacionEstadoBodegaDbRow[],
): JefeBodegaSlotPickerOption[] {
  return ubicacionesAlmacen.map((u, index) => {
    const libre = (u.estado_slot?.toLowerCase() ?? "libre") === "libre";
    return {
      id: u.id_ubicacion,
      title: u.codigo,
      subtitle: libre ? "Casillero libre" : `Estado: ${u.estado_slot}`,
      slotNumber: index + 1,
      codigo: u.codigo,
      visual: libre ? "vacia" : "ocupada_primario",
      detalle: libre
        ? null
        : {
            productoNombre: u.codigo,
            idPaquete: null,
            cliente: null,
            cantidad: "—",
            posicion: u.codigo,
            temperatura: null,
            ordenCompraCodigo: null,
            lockedBy: null,
          },
    };
  });
}

interface BuildIngresoProductoOptionsParams {
  ingresoStock: WarehouseStateRow[];
  ingresoIds: Set<string>;
  codigoByUbicacion: Map<string, string>;
  ubicacionesIngreso: UbicacionEstadoBodegaDbRow[];
  ubicacionesBloqueadas: Set<string>;
}

export function buildIngresoProductoOptions({
  ingresoStock,
  ingresoIds,
  codigoByUbicacion,
  ubicacionesIngreso,
  ubicacionesBloqueadas,
}: BuildIngresoProductoOptionsParams): JefeBodegaSlotPickerOption[] {
  const ingresoSorted = [...ubicacionesIngreso].sort((a, b) =>
    a.codigo.localeCompare(b.codigo, "es"),
  );
  const slotNumberById = new Map(
    ingresoSorted.map((u, index) => [u.id_ubicacion, index + 1]),
  );

  return ingresoStock
    .filter((row) => ingresoIds.has(row.id_ubicacion))
    .filter((row) => !ubicacionesBloqueadas.has(row.id_ubicacion))
    .filter((row) => Number.parseFloat(row.cantidad || "0") > 0)
    .map((row) => {
      const codigoSlot =
        codigoByUbicacion.get(row.id_ubicacion) ?? "Ingreso";
      const nombre = resolveProductoNombre(row) ?? "Producto";
      const orden = resolveOrdenCompraCodigo(row);
      const temp = formatTemperaturaSlot(row.temperatura);
      const cantidad = formatCantidadSlot(row.cantidad);
      return {
        id: row.id_warehouse_state,
        title: `${codigoSlot} — ${nombre}`,
        subtitle: orden ?? null,
        meta: temp,
        slotNumber: slotNumberById.get(row.id_ubicacion) ?? 1,
        codigo: codigoSlot,
        visual: "ocupada_primario" as const,
        detalle: {
          productoNombre: nombre,
          idPaquete: orden,
          cliente: null,
          cantidad,
          posicion: codigoSlot,
          temperatura: temp,
          ordenCompraCodigo: orden,
          lockedBy: row.locked_by?.trim() || null,
        },
      };
    });
}
