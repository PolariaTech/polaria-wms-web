export const TIPOS_INTEGRACION = [
  { value: "scraping", label: "Scraping" },
  { value: "api", label: "API" },
  { value: "csv_plano", label: "CSV plano" },
] as const;

export type TipoIntegracion = (typeof TIPOS_INTEGRACION)[number]["value"];

export const ESTADO_INTEGRACION_LABELS: Record<string, string> = {
  activo: "Activa",
  finalizado: "Finalizada",
};

export const TIPO_INTEGRACION_LABELS: Record<TipoIntegracion, string> = {
  scraping: "Scraping",
  api: "API",
  csv_plano: "CSV plano",
};

export function formatTipoIntegracion(tipo: string | null | undefined): string {
  if (!tipo) return "—";
  return TIPO_INTEGRACION_LABELS[tipo as TipoIntegracion] ?? tipo;
}

export function formatEstadoIntegracion(estado: string): string {
  return ESTADO_INTEGRACION_LABELS[estado] ?? estado;
}

export function isSolicitudIntegracionPendiente(estado: string): boolean {
  return estado.toLowerCase() !== "finalizado";
}
