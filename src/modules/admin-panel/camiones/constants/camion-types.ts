export const CAMION_TIPO_OPTIONS = [
  { value: "refrigerado", label: "Refrigerado" },
  { value: "seco", label: "Seco" },
  { value: "isotermico", label: "Isotérmico" },
] as const;

export type CamionTipo = (typeof CAMION_TIPO_OPTIONS)[number]["value"];

export function getCamionTipoLabel(tipo: string): string {
  const match = CAMION_TIPO_OPTIONS.find((item) => item.value === tipo);
  return match?.label ?? tipo;
}

export function formatCamionMarcaModelo(
  marca: string | null,
  modelo: string | null,
): string {
  const parts = [marca?.trim(), modelo?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "—";
}

export function formatCamionDecimal(
  value: number | null,
  unit: string,
): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toLocaleString("es-CO")} ${unit}`;
}

export function formatCamionCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
