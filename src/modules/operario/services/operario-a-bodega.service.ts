import { listTareasColaApi } from "@/modules/operations";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";

export interface ListTareasOperarioABodegaParams {
  codigoCuenta: string | null;
  idBodega: string | null;
  idUsuario: string | null;
}

/** Tareas de movimiento / traslado pendientes asignadas al operario (API Nest). */
export async function listTareasOperarioABodega(
  params: ListTareasOperarioABodegaParams,
): Promise<TareaColaRow[]> {
  const { codigoCuenta, idBodega, idUsuario } = params;

  if (!codigoCuenta || !idBodega || !idUsuario) {
    return [];
  }

  const rows = await listTareasColaApi({
    codigoCuenta,
    idBodega,
    idAsignado: idUsuario,
    estado: "pendiente",
  });

  return rows.filter(
    (row) =>
      row.tipo === "movimiento" ||
      row.tipo === "despacho" ||
      row.tipo === "revision",
  );
}
