import { calendarDayKey } from "@/components/shared/utils/formatters";

/**
 * REQ-177 / REQ-205: el día del topbar filtra por fecha de entrega
 * de ese día y del día siguiente (hoy y mañana).
 * Una fecha vacía no se oculta: el pedido sigue en la lista.
 * Un valor `YYYY-MM-DD` (o que empieza así) se compara por ese día calendario,
 * igual que el campo de captura, sin correrlo por la zona horaria.
 * El día siguiente se calcula sobre el calendario `YYYY-MM-DD`, sin zona horaria.
 */
function diaCalendarioSiguiente(isoDay: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }
  utc.setUTCDate(utc.getUTCDate() + 1);
  const mes = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(utc.getUTCDate()).padStart(2, "0");
  return `${utc.getUTCFullYear()}-${mes}-${dia}`;
}

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
  return dia === diaFiltro || dia === diaCalendarioSiguiente(diaFiltro);
}
