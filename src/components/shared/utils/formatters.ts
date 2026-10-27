import {
  CUENTA_ZONA_HORARIA_DEFAULT,
  resolveCuentaZonaHorariaId,
} from "@/modules/configurator/cuentas/constants/cuenta-zona-horaria";

/**
 * Formatea un instante ISO/UTC a fecha+hora en la zona de la cuenta
 * (default Cancún). No usa la zona del PC.
 */
export function formatDateTime(
  value: string | null | undefined,
  timeZone: string = CUENTA_ZONA_HORARIA_DEFAULT,
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const zone = resolveCuentaZonaHorariaId(timeZone);
  return date.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: zone,
  });
}

/** Día calendario `YYYY-MM-DD` de un instante en la zona indicada. */
export function calendarDayKey(
  value: string | Date,
  timeZone: string = CUENTA_ZONA_HORARIA_DEFAULT,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const zone = resolveCuentaZonaHorariaId(timeZone);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
