import * as chrono from "chrono-node";
import {
  formatIso,
  normalizarHoraAHhMm,
  parseFechaConMesNombre,
  parseFechaNumerica,
} from "./extract-entrega-desde-texto-fechas";

export { normalizarHoraAHhMm };
export { quitarContactoDeDireccion } from "./quitar-contacto-direccion";
export { extractDireccionShipToDesdeTexto } from "./extract-direccion-ship-to";

export type EntregaExtraidaTexto = {
  /** YYYY-MM-DD si se pudo resolver. */
  fechaIso: string | null;
  /** Frase candidata de fecha (para resolverFechaEntrega / UI). */
  fechaFrase: string | null;
  /** HH:MM 24h */
  horarioDesde: string | null;
  /** HH:MM 24h */
  horarioHasta: string | null;
};

const ENTREGA_CTX =
  /(?:fecha\s*(?:de\s*)?(?:entrega|envio|env[ií]o)|(?:^|[^\wáéíóúñ])entrega\s*:|entregar?\s+(?:el|para|el\s+d[ií]a)|delivery\s*date|deliver(?:y)?\s+(?:on|by)|para\s+el|el\s+d[ií]a)\b/i;

/** Fechas de metadatos del correo (no son entrega del pedido). REQ-119 */
const META_FECHA_CTX =
  /\b(?:enviad[oa]|sent|received|recibid[oa]|fecha\s*(?:del?\s*)?(?:correo|mensaje)|dated)\b/i;

/** Línea etiquetada: Entrega: viernes, 23 de octubre de 2026 */
const LINEA_ENTREGA_RE =
  /(?:^|\n)\s*(?:(?:fecha\s+de\s+)?entrega|delivery\s*date)\s*:\s*([^\n]+)/i;

/**
 * Busca la mejor frase de fecha cerca de contexto de entrega.
 * REQ-119: `Entrega:` gana sobre `Enviado:` / primera fecha del hilo.
 */
export function extraerFechaFraseDesdeTexto(texto: string): string | null {
  const raw = texto.replace(/\r\n/g, "\n");
  if (!raw.trim()) return null;

  const lineaEntrega = LINEA_ENTREGA_RE.exec(raw);
  if (lineaEntrega?.[1]?.trim()) {
    const resto = lineaEntrega[1].trim();
    // Preferir la fecha explícita dentro de la línea (ignora solo "viernes").
    const conMes = resto.match(
      /\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(?:de\s+)?\d{4})?\b/i,
    );
    if (conMes?.[0]) return conMes[0].trim();
    const numerica = resto.match(/\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/);
    if (numerica?.[0]) return numerica[0].trim();
    const iso = resto.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (iso?.[0]) return iso[0];
    return resto;
  }

  const patterns: RegExp[] = [
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b/g,
    /\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(?:de\s+)?\d{4})?\b/gi,
  ];

  type Hit = { frase: string; index: number; score: number };
  const hits: Hit[] = [];

  for (const re of patterns) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(raw)) != null) {
      const frase = match[0]!.trim();
      const index = match.index;
      const before = raw.slice(Math.max(0, index - 48), index);
      let score = ENTREGA_CTX.test(before) ? 100 : 10;
      if (META_FECHA_CTX.test(before)) score = Math.min(score, 5);
      hits.push({ frase, index, score });
    }
  }

  // Relativas cortas solo con contexto de entrega / pedido.
  const relativas =
    /\b(?:pasado\s+ma[nñ]ana|ma[nñ]ana|hoy|(?:el\s+)?(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)|en\s+\d+\s+d[ií]as?)\b/gi;
  let rel: RegExpExecArray | null;
  while ((rel = relativas.exec(raw)) != null) {
    const before = raw.slice(Math.max(0, rel.index - 48), rel.index);
    if (META_FECHA_CTX.test(before)) continue;
    if (
      ENTREGA_CTX.test(before) ||
      /pedido|entrega|enviar|favor\s+de/i.test(before)
    ) {
      hits.push({ frase: rel[0]!, index: rel.index, score: 80 });
    }
  }

  if (hits.length === 0) return null;
  // A igual score, preferir la fecha más tardía del documento (no la del encabezado).
  hits.sort((a, b) => b.score - a.score || b.index - a.index);
  return hits[0]!.frase;
}

function resolveFechaIso(
  frase: string | null,
  hoyISO: string,
): string | null {
  if (!frase?.trim()) return null;
  const numerica = parseFechaNumerica(frase);
  if (numerica) return numerica;
  const conMes = parseFechaConMesNombre(frase, hoyISO);
  if (conMes) return conMes;

  const referencia = new Date(`${hoyISO}T12:00:00Z`);
  const resultado = chrono.es.parseDate(frase, referencia, {
    forwardDate: true,
  });
  return resultado ? formatIso(resultado) : null;
}

/**
 * Extrae ventana de horas del cuerpo (rangos o hora única de entrega).
 */
export function extraerHorarioDesdeTexto(texto: string): {
  horarioDesde: string | null;
  horarioHasta: string | null;
} {
  const raw = texto.replace(/\r\n/g, "\n");
  if (!raw.trim()) return { horarioDesde: null, horarioHasta: null };

  type RangeHit = {
    desde: string;
    hasta: string;
    score: number;
    index: number;
  };
  const ranges: RangeHit[] = [];

  const dedicatedRanges: Array<{ re: RegExp; score: number }> = [
    {
      score: 100,
      re: /(?:ventana(?:\s+de\s+recepci[oó]n)?|horario(?:\s+de\s+(?:entrega|recepci[oó]n))?|delivery\s+(?:window|hours?)|hora(?:rio)?\s+de\s+entrega)[^\n\d]{0,48}(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?\s*[-–—/]\s*(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?/i,
    },
    {
      score: 95,
      re: /(?:entre|de)\s+(?:las?\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?\s+(?:y|a|to|until|hasta)\s+(?:las?\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?/i,
    },
    {
      score: 80,
      re: /(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)\s*[-–—]\s*(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)/i,
    },
    {
      score: 70,
      re: /(\d{1,2})(?:[:.](\d{2}))?\s*(?:h(?:rs?)?)?\s*[-–—]\s*(\d{1,2})(?:[:.](\d{2}))?\s*(?:h(?:rs?)?)?\b/i,
    },
  ];

  for (const { re, score } of dedicatedRanges) {
    const m = re.exec(raw);
    if (!m) continue;
    const desde = normalizarHoraAHhMm(m[1]!, m[2], m[3]);
    const hasta = normalizarHoraAHhMm(m[4]!, m[5], m[6]);
    if (desde && hasta) {
      ranges.push({ desde, hasta, score, index: m.index });
    }
  }

  if (ranges.length > 0) {
    ranges.sort((a, b) => b.score - a.score || a.index - b.index);
    return {
      horarioDesde: ranges[0]!.desde,
      horarioHasta: ranges[0]!.hasta,
    };
  }

  // Single delivery hour.
  const singleRes: Array<{ re: RegExp; score: number }> = [
    {
      score: 100,
      re: /(?:hora\s+de\s+entrega|entregar?\s+a\s+las?|delivery\s+time|a\s+partir\s+de\s+las?|desde\s+las?)[^\n\d]{0,24}(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?/i,
    },
    {
      score: 60,
      re: /\b(?:a\s+las?)\s+(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)\b/i,
    },
  ];

  type SingleHit = { hora: string; score: number; index: number };
  const singles: SingleHit[] = [];
  for (const { re, score } of singleRes) {
    const m = re.exec(raw);
    if (!m) continue;
    const hora = normalizarHoraAHhMm(m[1]!, m[2], m[3]);
    if (hora) singles.push({ hora, score, index: m.index });
  }

  if (singles.length > 0) {
    singles.sort((a, b) => b.score - a.score || a.index - b.index);
    return { horarioDesde: singles[0]!.hora, horarioHasta: null };
  }

  return { horarioDesde: null, horarioHasta: null };
}

/**
 * Extracción determinista de fecha/hora de entrega desde el cuerpo del correo/PDF.
 * Complementa a Mateo cuando deja fecha/horario en null.
 */
export function extractEntregaDesdeTexto(
  texto: string | null | undefined,
  hoyISO: string,
): EntregaExtraidaTexto {
  const raw = (texto ?? "").trim();
  if (!raw) {
    return {
      fechaIso: null,
      fechaFrase: null,
      horarioDesde: null,
      horarioHasta: null,
    };
  }

  const fechaFrase = extraerFechaFraseDesdeTexto(raw);
  const fechaIso = resolveFechaIso(fechaFrase, hoyISO);
  const { horarioDesde, horarioHasta } = extraerHorarioDesdeTexto(raw);

  return { fechaIso, fechaFrase, horarioDesde, horarioHasta };
}
