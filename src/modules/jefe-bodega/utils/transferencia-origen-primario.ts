import { parseProcesamientoSolicitudRef } from "@/modules/processing/shared/constants/procesamiento-solicitud-ref";
import type { OrdenTrabajoApiRow } from "@/modules/operations";
import type { WarehouseStateRow } from "@/modules/inventory/shared/types/inventory.types";

/** Destino fijo del sobrante: casillero de almacenamiento de donde salió el primario. */
export function resolveUbicacionOrigenPrimarioDesdeOt(params: {
  idUbicacionProcesamiento: string;
  idSolicitud: string | null;
  idProductoPrimario: string | null;
  ordenes: OrdenTrabajoApiRow[];
  almacenIds: ReadonlySet<string>;
  warehouseRows: WarehouseStateRow[];
}): string | null {
  const {
    idUbicacionProcesamiento,
    idSolicitud,
    idProductoPrimario,
    ordenes,
    almacenIds,
    warehouseRows,
  } = params;

  const matchingOt = ordenes.find((orden) => {
    if (orden.tipoFlujo !== "a_procesamiento") return false;
    if (orden.idUbicacionDestino !== idUbicacionProcesamiento) return false;
    if (!orden.idUbicacionOrigen || !almacenIds.has(orden.idUbicacionOrigen)) {
      return false;
    }
    if (idSolicitud) {
      const ref = parseProcesamientoSolicitudRef(orden.observaciones);
      if (ref && ref !== idSolicitud) return false;
    }
    return true;
  });

  if (matchingOt?.idUbicacionOrigen) {
    return matchingOt.idUbicacionOrigen;
  }

  if (!idProductoPrimario) return null;

  const withStock = warehouseRows.find(
    (row) =>
      almacenIds.has(row.id_ubicacion) &&
      row.id_producto === idProductoPrimario &&
      Number.parseFloat(row.cantidad || "0") >= 0,
  );

  return withStock?.id_ubicacion ?? null;
}
