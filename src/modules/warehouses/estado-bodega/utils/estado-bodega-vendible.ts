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

/** Stock vendible: slots de almacenamiento (misma regla que el mapa de bodega). */
export function isUbicacionEstadoBodegaVendible(
  ubicacion: UbicacionEstadoBodegaDbRow,
): boolean {
  const tipo = resolveTipoUbicacion(ubicacion.tipo_ubicacion);
  const codigo = tipo?.codigo?.toUpperCase() ?? "";

  if (Boolean(tipo?.es_recepcion) || codigo === "INGRESO") {
    return false;
  }

  if (Boolean(tipo?.es_picking) || codigo.includes("SALIDA")) {
    return false;
  }

  if (
    (ubicacion.estado_slot ?? "") === "en_proceso" ||
    codigo.includes("PROCES")
  ) {
    return false;
  }

  return true;
}
