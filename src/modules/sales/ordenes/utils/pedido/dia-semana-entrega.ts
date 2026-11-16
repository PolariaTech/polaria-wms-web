import {
  formatIsoToDdMonYyyy,
  parseDdMmYyyyToIso,
} from "@/lib/utils/fecha-dd-mm-yyyy";

const DIAS_SEMANA_ES = [
  "DOMINGO",
  "LUNES",
  "MARTES",
  "MIÉRCOLES",
  "JUEVES",
  "VIERNES",
  "SÁBADO",
] as const;

/**
 * Día de la semana en mayúsculas a partir de DD-MMM-AAAA, DD/MM/AAAA o ISO.
 * REQ-143 (impresión) / REQ-257 (formulario) / REQ-320 (formato visual).
 */
export function diaSemanaEntregaEs(fecha: string): string {
  const raw = fecha.trim();
  if (!raw) return "";
  const iso =
    parseDdMmYyyyToIso(raw) ??
    (/^(\d{4})-(\d{2})-(\d{2})/.exec(raw) ? raw.slice(0, 10) : null);
  if (!iso) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (Number.isNaN(date.getTime())) return "";
  return DIAS_SEMANA_ES[date.getUTCDay()] ?? "";
}

/** Misma lógica, con capitalización para UI (ej. «Sábado»). */
export function diaSemanaEntregaEsTitulo(fecha: string): string {
  const raw = diaSemanaEntregaEs(fecha);
  if (!raw) return "";
  return raw.charAt(0) + raw.slice(1).toLocaleLowerCase("es");
}

/**
 * Fecha de entrega en un solo valor: `17-NOV-2026 (MARTES)` (REQ-321).
 * Acepta ISO, DD-MMM-AAAA o slash; vacío si no hay fecha válida.
 */
export function formatFechaEntregaConDia(fecha: string): string {
  const raw = fecha.trim();
  if (!raw) return "";
  const iso =
    parseDdMmYyyyToIso(raw) ??
    (/^(\d{4})-(\d{2})-(\d{2})/.exec(raw) ? raw.slice(0, 10) : null);
  if (!iso) return "";
  const base = formatIsoToDdMonYyyy(iso);
  if (!base) return "";
  const dia = diaSemanaEntregaEs(iso);
  return dia ? `${base} (${dia})` : base;
}
