import type { EstadoProcesamiento } from "../types/processing.types";

export const ESTADO_PROCESAMIENTO_LABELS: Record<EstadoProcesamiento, string> = {
  borrador: "Borrador",
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  pendiente_cierre: "Pend. cierre",
  terminada: "Terminada",
  cancelada: "Cancelada",
};

export function formatEstadoProcesamiento(estado: string): string {
  return (
    ESTADO_PROCESAMIENTO_LABELS[estado as EstadoProcesamiento] ?? estado
  );
}

export function formatKilos(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return String(value);
  return `${parsed.toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })} kg`;
}

export function formatUnidades(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return String(value);
  return parsed.toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}
