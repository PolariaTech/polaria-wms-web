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
  return value.toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}
