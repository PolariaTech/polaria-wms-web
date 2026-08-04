/** Hoy calendario en America/Bogota (`YYYY-MM-DD`) para inputs `type="date"`. */
export function todayIsoDateBogota(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
