import type { BodegaInternaVinculadaRow } from "@/modules/admin-panel";

export function formatTodayInputValue(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export function formatBodegaLabel(bodega: BodegaInternaVinculadaRow): string {
  return `${bodega.nombre} (${bodega.codigo})`;
}

export function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}
