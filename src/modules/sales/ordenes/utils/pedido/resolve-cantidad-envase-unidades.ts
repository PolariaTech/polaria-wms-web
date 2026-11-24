export type FamiliaUnidad = "ltr" | "kg" | "pza" | "unknown";

const ENVASE_NOMBRE =
  String.raw`galon(?:es)?|gal\.?|cubeta(?:s)?|bidon(?:es)?|garrafa(?:s)?|envase(?:s)?|botella(?:s)?|frasco(?:s)?|tarro(?:s)?|lata(?:s)?|saco(?:s)?|bolsa(?:s)?|pieza(?:s)?|pzas?|pza\.?|unidad(?:es)?|unds?|caja(?:s)?|cja\.?|packs?|bandeja(?:s)?`;

const CONTENIDO_UNIDAD =
  String.raw`litro(?:s)?|lts?\.?|l\.?|kg|kilos?|kgs?\.?|gramos?|grs?\.?|g\.?|ml|mililitros?|pieza(?:s)?|pzas?|pza\.?|unidad(?:es)?|unds?`;

export const ENVASE_RE = new RegExp(
  String.raw`\b(\d+(?:[.,]\d+)?)\s*(${ENVASE_NOMBRE})\s+(?:de\s+)?(\d+(?:[.,]\d+)?)\s*(${CONTENIDO_UNIDAD})\b`,
  "i",
);

/** Sin número de envases al inicio: "galón de 5 litros". */
export const ENVASE_SIN_N_RE = new RegExp(
  String.raw`\b(${ENVASE_NOMBRE})\s+(?:de\s+)?(\d+(?:[.,]\d+)?)\s*(${CONTENIDO_UNIDAD})\b`,
  "i",
);

export function quitarAcentos(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function parseNum(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function roundQty(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function approx(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.051;
}

export function familiaDesdeToken(token: string): FamiliaUnidad {
  const t = quitarAcentos(token).replace(/\./g, "");
  if (
    /^(litros?|lts?|l)$/.test(t) ||
    t === "ml" ||
    t.startsWith("mililitro")
  ) {
    return "ltr";
  }
  if (/^(kg|kilos?|kgs?)$/.test(t)) return "kg";
  if (/^(gramos?|grs?|g)$/.test(t)) return "kg";
  if (/^(piezas?|pzas?|pza|unidades?|unds?)$/.test(t)) return "pza";
  return "unknown";
}

/** Normaliza ml→litros y g→kg en el número de contenido. */
export function normalizarContenido(
  valor: number,
  tokenUnidad: string,
): { valor: number; familia: FamiliaUnidad } {
  const t = quitarAcentos(tokenUnidad).replace(/\./g, "");
  if (t === "ml" || t.startsWith("mililitro")) {
    return { valor: valor / 1000, familia: "ltr" };
  }
  if (/^(gramos?|grs?|g)$/.test(t)) {
    return { valor: valor / 1000, familia: "kg" };
  }
  return { valor, familia: familiaDesdeToken(tokenUnidad) };
}

/**
 * Familia de la unidad de medida del catálogo (LTR, KGM, PZA, kg, l, …).
 */
export function familiaUnidadCatalogo(
  unidadMedida: string | null | undefined,
): FamiliaUnidad {
  const u = quitarAcentos((unidadMedida ?? "").trim()).replace(/\./g, "");
  if (!u) return "unknown";
  if (
    u === "ltr" ||
    u === "l" ||
    u === "lt" ||
    u === "lts" ||
    u.startsWith("litro") ||
    u === "ml"
  ) {
    return "ltr";
  }
  if (
    u === "kgm" ||
    u === "kg" ||
    u === "k" ||
    u === "kgs" ||
    u.startsWith("kilo") ||
    u === "g" ||
    u.startsWith("gramo")
  ) {
    return "kg";
  }
  if (
    u === "pza" ||
    u === "pz" ||
    u === "pzas" ||
    u === "un" ||
    u === "uno" ||
    u === "und" ||
    u === "unds" ||
    u.startsWith("pieza") ||
    u.startsWith("unidad")
  ) {
    return "pza";
  }
  if (u === "cja" || u === "cj" || u.startsWith("caja")) {
    // Caja como UoM de catálogo ≈ pieza/envase; no convertir contenido→caja.
    return "pza";
  }
  return "unknown";
}
