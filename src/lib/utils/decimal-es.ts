/** Parsea entrada numérica con coma o punto (p. ej. "15,6" o "15.6"). */
export function parseDecimalEs(raw: string): number | null {
  const normalized = String(raw)
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  if (
    normalized === "" ||
    normalized === "." ||
    normalized === "-" ||
    normalized === "-."
  ) {
    return null;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function formatKgEs(value: number): string {
  if (!Number.isFinite(value)) return "—";

  const rounded = Math.round(value * 10000) / 10000;
  const hasDecimals = Math.abs(rounded - Math.trunc(rounded)) > 1e-9;

  return rounded.toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: hasDecimals ? 4 : 0,
    useGrouping: Math.abs(rounded) >= 10_000,
  });
}

/** Formato de precio en pesos chilenos (sin decimales). */
export function formatPrecioEs(value: number): string {
  if (!Number.isFinite(value)) return "—";

  return Math.round(value).toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  });
}
