import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";
import type { UbicacionEstadoBodegaDbRow } from "../types/estado-bodega.types";

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

export function isUbicacionEntrada(
  ubicacion: UbicacionEstadoBodegaDbRow,
): boolean {
  const tipo = resolveTipoUbicacion(ubicacion.tipo_ubicacion);
  const codigo = tipo?.codigo?.toUpperCase() ?? "";

  return Boolean(tipo?.es_recepcion) || codigo === "INGRESO";
}

function isUbicacionOcupada(
  ubicacion: UbicacionEstadoBodegaDbRow,
  stockByUbicacion: Map<string, WarehouseStateRow[]>,
): boolean {
  const stockRows = stockByUbicacion.get(ubicacion.id_ubicacion) ?? [];
  if (stockRows.length > 0) {
    return true;
  }

  const estado = ubicacion.estado_slot?.toLowerCase() ?? "libre";
  return estado !== "libre";
}

/** Primer slot de zona ingreso libre para asignar mercancía recién recepcionada. */
export function resolveUbicacionIngresoDisponible(
  ubicaciones: UbicacionEstadoBodegaDbRow[],
  warehouseRows: WarehouseStateRow[],
): string | null {
  const stockByUbicacion = new Map<string, WarehouseStateRow[]>();

  for (const row of warehouseRows) {
    const current = stockByUbicacion.get(row.id_ubicacion) ?? [];
    current.push(row);
    stockByUbicacion.set(row.id_ubicacion, current);
  }

  const candidatas = ubicaciones
    .filter(isUbicacionEntrada)
    .filter((ubicacion) => !isUbicacionOcupada(ubicacion, stockByUbicacion))
    .sort((a, b) => a.codigo.localeCompare(b.codigo, "es"));

  return candidatas[0]?.id_ubicacion ?? null;
}

export function countUbicacionesEntrada(
  ubicaciones: UbicacionEstadoBodegaDbRow[],
): number {
  return ubicaciones.filter(isUbicacionEntrada).length;
}
