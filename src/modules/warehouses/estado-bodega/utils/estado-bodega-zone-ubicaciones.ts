import type { UbicacionEstadoBodegaDbRow } from "../types/estado-bodega.types";
import { isUbicacionEntrada } from "./estado-bodega-ingreso";

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

function tipoUbicacionFlags(
  tipo: UbicacionEstadoBodegaDbRow["tipo_ubicacion"],
): { es_picking: boolean } {
  const row = resolveTipoUbicacion(tipo);
  return { es_picking: row?.es_picking === true };
}

/** Stock vendible: solo slots de almacenamiento (no ingreso, salida ni procesamiento). */
export function isUbicacionStockVentaAlmacenamiento(
  ubicacion: Pick<UbicacionEstadoBodegaDbRow, "tipo_ubicacion">,
): boolean {
  const tipo = resolveTipoUbicacion(ubicacion.tipo_ubicacion);
  const codigo = tipo?.codigo?.toUpperCase() ?? "";

  if (tipo?.es_recepcion || codigo === "INGRESO") return false;
  if (tipo?.es_picking || codigo.includes("SALIDA")) return false;
  if (codigo.includes("PROCES")) return false;

  return true;
}

export function listAlmacenamientoVentaUbicacionIds(
  ubicaciones: UbicacionEstadoBodegaDbRow[],
): Set<string> {
  return new Set(
    ubicaciones
      .filter(isUbicacionStockVentaAlmacenamiento)
      .map((ubicacion) => ubicacion.id_ubicacion),
  );
}

export function listSalidaUbicacionIds(
  ubicaciones: UbicacionEstadoBodegaDbRow[],
): Set<string> {
  return new Set(
    ubicaciones
      .filter((ubicacion) => tipoUbicacionFlags(ubicacion.tipo_ubicacion).es_picking)
      .map((ubicacion) => ubicacion.id_ubicacion),
  );
}

export function listIngresoUbicacionIds(
  ubicaciones: UbicacionEstadoBodegaDbRow[],
): Set<string> {
  return new Set(
    ubicaciones.filter(isUbicacionEntrada).map((ubicacion) => ubicacion.id_ubicacion),
  );
}
