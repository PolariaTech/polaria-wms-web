/**
 * REQ-158: "3 piezas, aprox 5.4 KG" del correo de Aguacates de Puebla.
 * La cantidad del pedido es el peso; las piezas van a la especificación.
 */

export type PiezasAproxKg = {
  piezas: number;
  kg: number;
  especificacion: string;
};

const PIEZAS_APROX_KG =
  /(\d+(?:[.,]\d+)?)\s*(?:piezas?|pzas?|pza)\b[\s,;:.()-]{0,16}aprox(?:imadamente)?\.?\s*(\d+(?:[.,]\d+)?)\s*(?:kilos?|kgs?|kgm|kg)\b/i;

function norm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumero(raw: string): number | null {
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatoNumero(n: number): string {
  const rounded = Math.round(n * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function parsePiezasAproxKg(
  raw: string | null | undefined,
): PiezasAproxKg | null {
  const text = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  const match = text.match(PIEZAS_APROX_KG);
  if (!match?.[1] || !match[2]) return null;
  const piezas = parseNumero(match[1]);
  const kg = parseNumero(match[2]);
  if (piezas == null || kg == null) return null;
  return {
    piezas,
    kg,
    especificacion: `${formatoNumero(piezas)} PZA`,
  };
}

function unirEspecificacion(
  actual: string | null | undefined,
  extra: string,
): string {
  const base = actual?.trim() || "";
  if (!base) return extra;
  if (norm(base).includes(norm(extra))) return base;
  return `${base} · ${extra}`;
}

/**
 * Busca el par piezas + kilos en el texto de la línea.
 * El cuerpo completo del correo solo cuenta si la línea nombra a este producto.
 */
export function piezasAproxKgParaLinea(params: {
  producto: string;
  textosLinea?: readonly (string | null | undefined)[];
  textoFuente?: string | null;
}): PiezasAproxKg | null {
  for (const texto of params.textosLinea ?? []) {
    const parsed = parsePiezasAproxKg(texto);
    if (parsed) return parsed;
  }

  const nombre = norm(params.producto);
  const fuente = params.textoFuente?.trim() || "";
  if (nombre.length < 3 || !fuente) return null;

  const hits: PiezasAproxKg[] = [];
  const vistos = new Set<string>();
  for (const line of fuente.split(/\n/)) {
    if (!norm(line).includes(nombre)) continue;
    const parsed = parsePiezasAproxKg(line);
    if (!parsed) continue;
    const clave = `${parsed.piezas}|${parsed.kg}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    hits.push(parsed);
  }
  return hits.length === 1 ? hits[0]! : null;
}

export function aplicarPiezasAproxKg<
  T extends {
    textoOriginal: string;
    cantidad: number | null;
    especificacion: string | null;
    unidad: string | null;
  },
>(
  lineas: readonly T[],
  textoFuente?: string | null,
  textosExtra?: readonly (string | null | undefined)[],
): T[] {
  return lineas.map((linea, index) => {
    const parsed = piezasAproxKgParaLinea({
      producto: linea.textoOriginal,
      textosLinea: [linea.textoOriginal, textosExtra?.[index]],
      textoFuente,
    });
    if (!parsed) return linea;
    return {
      ...linea,
      cantidad: parsed.kg,
      unidad: "KGM",
      especificacion: unirEspecificacion(linea.especificacion, parsed.especificacion),
    };
  });
}

export function especificacionConPiezas(
  actual: string | null | undefined,
  piezas: PiezasAproxKg | null,
): string {
  if (!piezas) return actual?.trim() || "";
  return unirEspecificacion(actual, piezas.especificacion);
}
