import { calendarDayKey } from "@/components/shared/utils/formatters";

/**
 * REQ-177: el día del topbar filtra por fecha de entrega.
 * Una fecha vacía no se oculta: el pedido sigue en la lista.
 * Un valor `YYYY-MM-DD` (o que empieza así) se compara por ese día calendario,
 * igual que el campo de captura, sin correrlo por la zona horaria.
 */
export function ordenPasaFiltroFechaEntrega(
  fechaEntrega: string | null | undefined,
  diaFiltro: string,
  timeZone: string,
): boolean {
  const raw = fechaEntrega?.trim() ?? "";
  if (!raw) return true;
  const dia = /^\d{4}-\d{2}-\d{2}/.test(raw)
    ? raw.slice(0, 10)
    : calendarDayKey(raw, timeZone);
  if (!dia) return true;
  return dia === diaFiltro;
}
