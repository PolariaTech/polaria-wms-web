import type { OrigenCorreoRenglon } from "./origen-correo-ordenes-trabajo";

export function parseCantidad(value: number | string | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numero = Number(value.replace(",", ".").trim());
    return Number.isFinite(numero) ? numero : 0;
  }
  return 0;
}

export function parsePrecio(value: number | string | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const numero = Number(value.replace(",", ".").trim());
    return Number.isFinite(numero) && numero > 0 ? numero : null;
  }
  return null;
}

export function pad2Fecha(valor: number): string {
  return String(valor).padStart(2, "0");
}

/** YYYY-MM-DD solo si el calendario es real (evita 2026-24-10). */
export function ymdIfValid(year: number, month: number, day: number): string | null {
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const fechaUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    fechaUtc.getUTCFullYear() !== year ||
    fechaUtc.getUTCMonth() + 1 !== month ||
    fechaUtc.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2Fecha(month)}-${pad2Fecha(day)}`;
}

/**
 * Resuelve a/b/yyyy ambiguo (DD/MM LatAm vs MM/DD US/BirchStreet).
 * Si solo una interpretación es calendario válido, la usa; si ambas, preferir DMY.
 */
export function parseSlashDateParts(
  first: number,
  second: number,
  year: number,
): string | null {
  const asDmy = ymdIfValid(year, second, first);
  const asMdy = ymdIfValid(year, first, second);
  if (asDmy && !asMdy) return asDmy;
  if (asMdy && !asDmy) return asMdy;
  if (asDmy && asMdy) return asDmy;
  return null;
}

/**
 * Normaliza fechas del tercero a YYYY-MM-DD.
 * Acepta ISO y slash dates (DD/MM o MM/DD); BirchStreet `10/24/2026` → 2026-10-24.
 */
export function parseFechaOrigen(
  value: string | null | undefined,
): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const iso = raw.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso?.[1]) {
    const [y, m, d] = iso[1].split("-").map(Number);
    return ymdIfValid(y!, m!, d!);
  }
  const slash = raw.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (!slash) return null;
  const first = Number(slash[1]);
  const second = Number(slash[2]);
  const yearRaw = slash[3]!;
  const year =
    yearRaw.length === 2
      ? Number(yearRaw) >= 70
        ? 1900 + Number(yearRaw)
        : 2000 + Number(yearRaw)
      : Number(yearRaw);
  return parseSlashDateParts(first, second, year);
}

/**
 * Fecha de entrega desde OTs / origen_correo (adjuntos BirchStreet, etc.).
 * REQ-110: no confirmar a ciegas si el form está vacío pero el origen trae Fecha.
 */
export function resolveFechaEntregaDesdeOrigen(params: {
  origenCorreo: OrigenCorreoRenglon[];
  hijas?: Array<{ fecha?: string | null }>;
}): string | null {
  for (const hija of params.hijas ?? []) {
    const fromHija = parseFechaOrigen(hija.fecha);
    if (fromHija) return fromHija;
  }
  for (const row of params.origenCorreo) {
    const fromRow = parseFechaOrigen(row.Fecha);
    if (fromRow) return fromRow;
  }
  return null;
}
