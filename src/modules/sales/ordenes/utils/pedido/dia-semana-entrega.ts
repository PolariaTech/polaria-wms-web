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
 * Día de la semana en mayúsculas a partir de DD/MM/AAAA o ISO (YYYY-MM-DD).
 * REQ-143 (impresión) / REQ-257 (formulario).
 */
export function diaSemanaEntregaEs(fecha: string): string {
  const raw = fecha.trim();
  if (!raw) return "";
  let y = 0;
  let m = 0;
  let d = 0;
  const dmY = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dmY) {
    d = Number(dmY[1]);
    m = Number(dmY[2]);
    y = Number(dmY[3]);
  } else if (iso) {
    y = Number(iso[1]);
    m = Number(iso[2]);
    d = Number(iso[3]);
  } else {
    return "";
  }
  if (!y || !m || !d) return "";
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (Number.isNaN(date.getTime())) return "";
  return DIAS_SEMANA_ES[date.getUTCDay()] ?? "";
}

/** Misma lógica, con capitalización para UI (ej. «Sábado»). */
export function diaSemanaEntregaEsTitulo(fecha: string): string {
  const raw = diaSemanaEntregaEs(fecha);
  if (!raw) return "";
  return raw.charAt(0) + raw.slice(1).toLocaleLowerCase("es");
}
