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
