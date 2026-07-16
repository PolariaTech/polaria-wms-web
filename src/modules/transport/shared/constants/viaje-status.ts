import type { EstadoViajeTransporte } from "../types/transport.types";

const ESTADO_VIAJE_LABEL: Record<EstadoViajeTransporte, string> = {
  programado: "Programado",
  en_ruta: "En ruta",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export function formatEstadoViaje(estado: string): string {
  return ESTADO_VIAJE_LABEL[estado as EstadoViajeTransporte] ?? estado;
}

/** Viajes activos que el transportista debe atender. */
export const ESTADOS_VIAJE_EN_CURSO: readonly EstadoViajeTransporte[] = [
  "programado",
  "en_ruta",
];
