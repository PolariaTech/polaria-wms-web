const MESES_ABREVIADOS = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
] as const;

const MES_ABREV_A_NUMERO: Record<string, number> = Object.fromEntries(
  MESES_ABREVIADOS.map((abrev, index) => [abrev, index + 1]),
);

/** ISO `YYYY-MM-DD` → `DD-MMM-AAAA` (REQ-320; ej. `12-NOV-2026`). */
export function formatIsoToDdMonYyyy(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  const mes = match ? MESES_ABREVIADOS[Number(match[2]) - 1] : undefined;
  return match && mes ? `${match[3]}-${mes}-${match[1]}` : "";
}

/**
 * Alias histórico (REQ-090): ahora emite `DD-MMM-AAAA` (REQ-320).
 * El valor canónico del formulario sigue siendo ISO.
 */
export function formatIsoToDdMmYyyy(iso: string): string {
  return formatIsoToDdMonYyyy(iso);
}

/**
 * Antes `03-NOV` sin año; REQ-320 unifica a `03-NOV-2026`.
 * Se mantiene el nombre por los callers del batch de impresión.
 */
export function formatIsoToDdMonAbrev(iso: string): string {
  return formatIsoToDdMonYyyy(iso);
}

/** Quita sufijo ` (DÍA)` de REQ-321 para poder parsear el valor del input. */
export function stripDiaSemanaFechaSuffix(raw: string): string {
  return raw.replace(/\s*\([^)]*\)\s*$/u, "").trim();
}

/**
 * Acepta `DD-MMM-AAAA`, `DD-MMM-AAAA (DÍA)`, `DD/MM/AAAA`, `D/M/AAAA` o ISO `YYYY-MM-DD`.
 * Devuelve ISO o null si no es fecha calendario válida.
 */
export function parseDdMmYyyyToIso(raw: string): string | null {
  const trimmed = stripDiaSemanaFechaSuffix(raw);
  if (!trimmed) return null;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return isValidYmd(year, month, day)
      ? `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
      : null;
  }

  const monY = /^(\d{1,2})-([A-Za-zÁÉÍÓÚáéíóúÜü]{3})-(\d{4})$/.exec(trimmed);
  if (monY) {
    const day = Number(monY[1]);
    const month = MES_ABREV_A_NUMERO[monY[2].toLocaleUpperCase("es")] ?? 0;
    const year = Number(monY[3]);
    if (!month || !isValidYmd(year, month, day)) return null;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const dmY = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(trimmed);
  if (!dmY) return null;
  const day = Number(dmY[1]);
  const month = Number(dmY[2]);
  const year = Number(dmY[3]);
  if (!isValidYmd(year, month, day)) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidYmd(year: number, month: number, day: number): boolean {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
