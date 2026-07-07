import { listTareasCola } from "@/modules/processing";
import type { TareaColaRow } from "@/modules/processing";

export interface ListTareasOperarioABodegaParams {
  codigoCuenta: string | null;
  idBodega: string | null;
  idUsuario: string | null;
}

/** Tareas de movimiento / traslado pendientes asignadas al operario. */
export async function listTareasOperarioABodega(
  params: ListTareasOperarioABodegaParams,
): Promise<TareaColaRow[]> {
  const { codigoCuenta, idBodega, idUsuario } = params;

  if (!codigoCuenta || !idBodega || !idUsuario) {
    return [];
  }

  const rows = await listTareasCola({
    codigoCuenta,
    idBodega,
  });

  return rows.filter(
    (row) =>
      row.id_asignado === idUsuario &&
      row.estado === "pendiente" &&
      row.tipo === "movimiento",
  );
}
