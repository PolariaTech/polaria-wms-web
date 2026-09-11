/** Parsea entrada numérica con coma o punto (p. ej. "15,6", ".6" o ",6"). */
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

/**
 * Si el usuario empieza con punto o coma (".6", ",6"), antepone 0
 * y unifica el decimal a coma.
 */
export function coerceLeadingDecimalInput(raw: string): string {
  if (raw === "." || raw === ",") return "0,";
  if (raw.startsWith(".")) return `0,${raw.slice(1)}`;
  if (raw.startsWith(",")) return `0${raw}`;
  return raw;
}

/** Muestra el decimal con coma (p. ej. 0.6 → "0,6"). */
export function formatDecimalInputEs(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (Number.isInteger(value)) return String(value);
  return String(value).replace(".", ",");
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
