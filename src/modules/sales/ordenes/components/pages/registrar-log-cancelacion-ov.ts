import { postOrdenVentaLog } from "../../services/orden-venta-log.client";

/** Soft-delete REQ-255: bitácora de cancelación (fallo de log no tumba el flujo). */
export function registrarLogCancelacionOv(params: {
  idOrdenVenta: string;
  codigoCuenta: string;
  autor: string;
  idUsuario: string | null;
  autorNombre: string | null;
  idBodega: string | null;
}): void {
  void postOrdenVentaLog({
    idOrdenVenta: params.idOrdenVenta,
    codigoCuenta: params.codigoCuenta,
    accion: "actualizacion",
    mensaje: `Orden cancelada por ${params.autor}.`,
    idUsuario: params.idUsuario,
    autorNombre: params.autorNombre,
    idBodega: params.idBodega,
  }).catch(() => undefined);
}
