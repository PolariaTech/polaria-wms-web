import {
  listWarehouseState,
  lockWarehouseStateApi,
  unlockWarehouseStateApi,
} from "@/modules/inventory";
import type { WarehouseStateRow } from "@/modules/inventory";
import { aplicarOrdenProcesamiento, iniciarProcesamiento } from "@/modules/processing";
import {
  parseRolDevolucionProcesamiento,
  type RolDevolucionProcesamiento,
} from "@/modules/processing/shared/constants/procesamiento-post-cierre";
import { parseProcesamientoSolicitudRef } from "@/modules/processing/shared/constants/procesamiento-solicitud-ref";
import { completarTareaColaApi } from "@/modules/operations";
import type { OperarioTareaView } from "../types/operario-tarea.types";

export function resolveIdSolicitudProcesamientoFromTarea(
  tarea: OperarioTareaView,
): string | null {
  const explicit = tarea.id_solicitud_procesamiento?.trim();
  if (explicit) return explicit;

  return parseProcesamientoSolicitudRef(
    tarea.titulo,
    tarea.descripcion,
    tarea.ordenObservaciones,
  );
}

export function resolveRolDevolucionFromTarea(
  tarea: OperarioTareaView,
): RolDevolucionProcesamiento | null {
  return parseRolDevolucionProcesamiento(
    tarea.ordenObservaciones,
    tarea.descripcion,
    tarea.titulo,
  );
}

/** Retiro almacenamiento → procesamiento (operario, fase 1). */
export function isTareaProcesamientoMovimiento(tarea: OperarioTareaView): boolean {
  if (isTareaPostCierreRetorno(tarea)) return false;

  return (
    tarea.tipo === "procesamiento" || tarea.tipoFlujo === "a_procesamiento"
  );
}

/** Devolución procesamiento → almacenamiento (operario, fase post-cierre). */
export function isTareaPostCierreRetorno(tarea: OperarioTareaView): boolean {
  const idSolicitud = resolveIdSolicitudProcesamientoFromTarea(tarea);
  if (!idSolicitud) return false;
  return resolveRolDevolucionFromTarea(tarea) !== null;
}

export function resolvePostCierreRolLabel(tarea: OperarioTareaView): string {
  const rol = resolveRolDevolucionFromTarea(tarea);

  if (rol === "procesado") return "Resultado procesado";
  if (rol === "desperdicio") return "Sobrante primario";
  return "Post-cierre";
}

/**
 * El Resultado (secundario) no existe como stock en PROC: se crea en destino
 * vía `aplicar`. No hay warehouse_state que bloquear en el origen.
 */
function requiereLockOrigen(tarea: OperarioTareaView): boolean {
  if (!tarea.id_orden_trabajo?.trim()) return false;
  if (tarea.tipoFlujo === "revisar") return false;
  if (resolveRolDevolucionFromTarea(tarea) === "procesado") return false;
  return Boolean(tarea.idUbicacionOrigen?.trim());
}

function parseCantidad(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function seleccionarWarehouseStateOrigen(
  rows: WarehouseStateRow[],
  idLoteOrden: string | null,
): WarehouseStateRow | null {
  const conStock = rows.filter((row) => parseCantidad(row.cantidad) > 0);
  if (conStock.length === 0) return null;

  const idLote = idLoteOrden?.trim();
  const filtradas = idLote
    ? conStock.filter((row) => row.id_lote === idLote)
    : conStock;

  const candidatas = filtradas.length > 0 ? filtradas : conStock;
  return candidatas[0] ?? null;
}

async function bloquearOrigenAntesDeMover(params: {
  tarea: OperarioTareaView;
  codigoCuenta: string;
  idBodega: string;
}): Promise<string | null> {
  const { tarea, codigoCuenta, idBodega } = params;
  if (!requiereLockOrigen(tarea)) return null;

  const idUbicacion = tarea.idUbicacionOrigen!.trim();
  const rows = await listWarehouseState({
    idBodega,
    codigoCuenta,
    idUbicacion,
  });

  const ws = seleccionarWarehouseStateOrigen(rows, tarea.idLoteOrden);
  if (!ws) {
    throw new Error(
      "No hay stock en el origen para ejecutar la orden. Verifica la posición en el mapa.",
    );
  }

  await lockWarehouseStateApi(ws.id_warehouse_state, {
    codigoCuenta,
    idBodega,
    expectedVersion: ws.version,
  });

  return ws.id_warehouse_state;
}

async function liberarLockOrigenBestEffort(params: {
  idWarehouseState: string | null;
  codigoCuenta: string;
  idBodega: string;
}): Promise<void> {
  const { idWarehouseState, codigoCuenta, idBodega } = params;
  if (!idWarehouseState) return;

  try {
    await unlockWarehouseStateApi(idWarehouseState, {
      codigoCuenta,
      idBodega,
    });
  } catch {
    // Tras transferir el stock el origen puede Haber quedado vacío o el API ya liberó el lock.
  }
}

export async function completarTareaOperario(params: {
  tarea: OperarioTareaView;
  codigoCuenta: string;
  idBodega: string;
}): Promise<void> {
  const { tarea, codigoCuenta, idBodega } = params;

  const rolPostCierre = resolveRolDevolucionFromTarea(tarea);

  /** Resultado: crear secundario en destino vía aplicar (sin transferir desde PROC). */
  if (isTareaPostCierreRetorno(tarea) && rolPostCierre === "procesado") {
    const idSolicitud = resolveIdSolicitudProcesamientoFromTarea(tarea);
    const idOrden = tarea.id_orden_trabajo?.trim();

    if (!idSolicitud || !idOrden) {
      throw new Error(
        "No se encontró la orden de post-cierre vinculada a la tarea.",
      );
    }

    await aplicarOrdenProcesamiento(idSolicitud, idOrden);
    return;
  }

  const idWarehouseStateLocked = await bloquearOrigenAntesDeMover({
    tarea,
    codigoCuenta,
    idBodega,
  });

  try {
    if (isTareaProcesamientoMovimiento(tarea)) {
      const idSolicitud = resolveIdSolicitudProcesamientoFromTarea(tarea);
      if (!idSolicitud) {
        throw new Error(
          "No se encontró la solicitud de procesamiento vinculada a la tarea.",
        );
      }

      await iniciarProcesamiento(idSolicitud, { codigoCuenta, idBodega });
    } else if (isTareaPostCierreRetorno(tarea)) {
      // Sobrante (desperdicio): mover primario físico con completar (transferencia).
      // No llamar aplicar aquí: devolverSobrantePrimario duplicaría stock en destino.
    }

    await completarTareaColaApi(tarea.id_tarea, { codigoCuenta, idBodega });
  } finally {
    await liberarLockOrigenBestEffort({
      idWarehouseState: idWarehouseStateLocked,
      codigoCuenta,
      idBodega,
    });
  }
}
