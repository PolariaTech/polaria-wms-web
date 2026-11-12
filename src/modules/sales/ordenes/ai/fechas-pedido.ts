import * as chrono from "chrono-node";

export function formatISO(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sumarDias(referencia: Date, dias: number): string {
  const d = new Date(referencia);
  d.setUTCDate(d.getUTCDate() + dias);
  return formatISO(d);
}

const SIN_ACENTOS: Record<string, string> = {
  á: "a",
  é: "e",
  í: "i",
  ó: "o",
  ú: "u",
  ñ: "n",
};
function quitarAcentos(s: string): string {
  return s.toLowerCase().replace(/[áéíóúñ]/g, (c) => SIN_ACENTOS[c] ?? c);
}

const DIAS_SEMANA: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

// AUDITORÍA 2026-09-03 · Hallazgo #6 (Alto) — chrono-node (usado en resolverFechaEntrega
// más abajo) falla en 3 patrones de fecha compuesta en español, confirmados en la
// auditoría real: "pasado mañana"/"pasado manana" (sin acento no resuelve nada; con
// acento resuelve mal, -1 día), "en N días" (no resuelve, da null), y "[día] de la
// próxima/otra semana" cuando ese día coincide con el día de hoy (resuelve a HOY en vez
// de a la semana siguiente). Fix: normalizador determinista propio que intercepta estos
// 3 patrones ANTES de pasarle el texto a chrono-node — sigue siendo 100% código, sin IA
// de por medio (ver principio general del archivo). Si ninguno de los 3 patrones aplica,
// se sigue delegando en chrono-node como antes.
export function normalizarFechaConocida(
  fraseOriginal: string,
  referencia: Date,
): string | null {
  const frase = quitarAcentos(fraseOriginal.trim());

  if (/^pasado\s+manana\b/.test(frase)) {
    return sumarDias(referencia, 2);
  }

  const enDias = frase.match(/^en\s+(\d+)\s+dias?\b/);
  if (enDias) {
    return sumarDias(referencia, Number(enDias[1]));
  }

  const proximaSemana = frase.match(
    /\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\s+de\s+la\s+(?:(proxima|otra|entrante)\s+semana|semana\s+(?:que\s+entra|siguiente|entrante))\b/,
  );
  if (proximaSemana) {
    const diaObjetivo = DIAS_SEMANA[proximaSemana[1]];
    const diaHoy = referencia.getUTCDay();
    // Calcula el domingo que abre la semana calendario ACTUAL, le suma 7 días para
    // llegar al domingo de la semana SIGUIENTE, y de ahí cuenta hasta el día objetivo.
    // (Una primera versión de este cálculo hacía "días hasta la próxima ocurrencia + 7",
    // que fallaba cuando el día objetivo ya había pasado esta semana: para el día ya
    // pasado, "la próxima ocurrencia" ya caía en la semana siguiente, y sumarle 7 de
    // más saltaba dos semanas en vez de una — lo atrapó la prueba unitaria de este día
    // ya pasado, "martes" con hoy=jueves.)
    const inicioSemanaSiguiente = sumarDias(referencia, 7 - diaHoy);
    return sumarDias(
      new Date(`${inicioSemanaSiguiente}T12:00:00Z`),
      diaObjetivo,
    );
  }

  return null;
}

/**
 * Resuelve una frase de fecha en español ("mañana", "el jueves", "15 de septiembre") a
 * una fecha ISO YYYY-MM-DD, anclada a hoyISO. Primero intenta los patrones conocidos que
 * chrono-node resuelve mal (normalizarFechaConocida); si ninguno aplica, usa chrono-node
 * (parser determinista de fechas en lenguaje natural) — en ambos casos, sin pedirle a la
 * IA que haga la aritmética.
 */
export function resolverFechaEntrega(
  fraseTexto: string | null,
  hoyISO: string,
): string | null {
  if (!fraseTexto) return null;
  const referencia = new Date(`${hoyISO}T12:00:00Z`);

  const conocida = normalizarFechaConocida(fraseTexto, referencia);
  if (conocida) return conocida;

  const resultado = chrono.es.parseDate(fraseTexto, referencia, {
    forwardDate: true,
  });
  return resultado ? formatISO(resultado) : null;
}
