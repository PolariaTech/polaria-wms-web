import type { EstadoOrdenCompra, EstadoSolicitudCompra } from "../../shared/types/purchases.types";

export const ESTADO_SOLICITUD_LABELS: Record<EstadoSolicitudCompra, string> = {
  borrador: "Borrador",
  pendiente_aprobacion: "Pendiente aprobación",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  convertida: "Convertida",
  cancelada: "Cancelada",
};

export const ESTADO_ORDEN_LABELS: Record<EstadoOrdenCompra, string> = {
  borrador: "Borrador",
  emitida: "Emitida",
  parcialmente_recibida: "Parcialmente recibida",
  recibida: "Recibida",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
};
