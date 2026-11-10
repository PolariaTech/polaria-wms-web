/**
 * REQ-287: madurez y formato/domo para el campo Especificación de línea.
 * Madurez siempre con etiqueta («Madurez: Amarillo»); domo desde nombre/texto.
 */

function quitarAcentos(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

const FRASE_MADUREZ =
  String.raw`no muy maduros?|bien firmes?|muy firmes?|firmes?|amarillos?|roj[oa]s?|verdes?|enrriados?|enriados?|pintones?|maduros?`;

/** Quita el prefijo Madurez:/Maduración:/Firmeza: para comparar sin duplicar. */
export function stripEtiquetaMadurez(value: string): string {
  return value
    .trim()
    .replace(
      /^(?:niveles?\s+de\s+)?(?:maduraci[oó]n|madurez|firmeza)\s*[:=]\s*/i,
      "",
    )
    .trim();
}

export function formatMadurezConEtiqueta(nivel: string): string {
  const limpio = stripEtiquetaMadurez(nivel);
  if (!limpio) return "";
  if (/^madurez\s*:/i.test(nivel.trim())) {
    return `Madurez: ${limpio}`;
  }
  return `Madurez: ${limpio}`;
}

function canonMadurezFrase(value: string | null | undefined): string | null {
  const phrase = quitarAcentos(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!phrase) return null;
  if (/^no muy maduros?$/.test(phrase)) return "No muy maduro";
  if (/^bien firmes?$/.test(phrase)) return "Bien firme";
  if (/^muy firmes?$/.test(phrase)) return "Muy firme";
  if (/^firmes?$/.test(phrase)) return "Firme";
  if (/^amarillos?$/.test(phrase)) return "Amarillo";
  if (/^roj[oa]s?$/.test(phrase)) return "Rojo";
  if (/^verdes?$/.test(phrase)) return "Verde";
  if (/^enrriados?$/.test(phrase) || /^enriados?$/.test(phrase)) return "Enrriado";
  if (/^pintones?$/.test(phrase)) return "Pintón";
  if (/^maduros?$/.test(phrase)) return "Maduro";
  return null;
}

function conEtiquetaSiCanon(nivel: string): string {
  return formatMadurezConEtiqueta(nivel);
}

/**
 * REQ-120 / REQ-158 / REQ-287: madurez o firmeza para Especificación.
 * Devuelve siempre «Madurez: {nivel}» cuando hay match canónico.
 */
export function extractMadurezEspecificacion(
  texto: string | null | undefined,
): string | null {
  const raw = (texto ?? "").trim();
  if (!raw) return null;
  const t = quitarAcentos(raw);

  const labeled = raw.match(
    /\b(?:niveles?\s+de\s+)?(?:maduraci[oó]n|madurez|firmeza|color|calidad)\s*[:=]\s*([^\n|;]{1,40})/i,
  );
  if (labeled?.[1]) {
    const valor = labeled[1].trim().replace(/[.:]+$/, "");
    const canon = canonMadurezFrase(valor);
    if (canon) return conEtiquetaSiCanon(canon);
    if (
      /maduraci[oó]n|madurez|firmeza/i.test(labeled[0]) &&
      valor.length > 0 &&
      valor.length <= 40
    ) {
      const capitalizado = valor.charAt(0).toUpperCase() + valor.slice(1);
      return conEtiquetaSiCanon(capitalizado);
    }
  }

  if (t.length <= 40) {
    const solo = t.match(
      new RegExp(String.raw`^(?:madurez\s+)?(${FRASE_MADUREZ})$`, "i"),
    );
    if (solo?.[1]) {
      const canon = canonMadurezFrase(solo[1]);
      return canon ? conEtiquetaSiCanon(canon) : null;
    }
  }

  // REQ-231: «verde»/«roja» en nombre de producto no son madurez.
  const inline = t.match(
    new RegExp(
      String.raw`\b(${FRASE_MADUREZ.replace("|roj[oa]s?|verdes?", "")})\b`,
      "i",
    ),
  );
  if (inline?.[1]) {
    const canon = canonMadurezFrase(inline[1]);
    return canon ? conEtiquetaSiCanon(canon) : null;
  }
  return null;
}

/** Normaliza «Domo de 500 g» → «Domo de 500g» (evidencia REQ-287). */
function formatDomoFrase(raw: string): string {
  const base = raw.replace(/\s+/g, " ").trim();
  const sinEspacioG = base.replace(/(\d)\s+(g|gr|gramos?)\b/i, "$1g");
  return sinEspacioG.replace(/^d/, "D");
}

/**
 * REQ-287: «(Domo de 500 g)», «Domo de 500g» o «Tamaño del domo: …» → especificación.
 */
export function extractDomoEspecificacion(
  texto: string | null | undefined,
): string | null {
  const raw = (texto ?? "").trim();
  if (!raw) return null;

  const labeled = raw.match(
    /\btama[nñ]o\s+del\s+domo\s*[:=]\s*([^\n|;()]{1,40})/i,
  );
  if (labeled?.[1]) {
    const valor = labeled[1].trim().replace(/[.:]+$/, "");
    if (!valor) return null;
    if (/^domo\b/i.test(valor)) return formatDomoFrase(valor);
    return `Tamaño del domo: ${valor}`;
  }

  const paren = raw.match(
    /\(\s*(domo\s+de\s+\d+(?:[.,]\d+)?\s*(?:g|kg|gr|gramos?)?)\s*\)/i,
  );
  if (paren?.[1]) return formatDomoFrase(paren[1]);

  const inline = raw.match(
    /\b(domo\s+de\s+\d+(?:[.,]\d+)?\s*(?:g|kg|gr|gramos?)?)\b/i,
  );
  if (inline?.[1]) return formatDomoFrase(inline[1]);

  return null;
}

/** True si el texto ya trae ese nivel (con o sin etiqueta Madurez:). */
export function textoYaTraeMadurez(
  haystack: string,
  madurez: string,
): boolean {
  const h = quitarAcentos(haystack).toLowerCase();
  const mFull = quitarAcentos(madurez).toLowerCase();
  const mNivel = quitarAcentos(stripEtiquetaMadurez(madurez)).toLowerCase();
  if (!mNivel) return false;
  if (h.includes(mFull)) return true;
  if (h.includes(`madurez: ${mNivel}`)) return true;
  if (h.includes(`maduracion: ${mNivel}`)) return true;
  // «Amarillo · Firme» ya incluye el nivel suelto.
  const partes = h.split(/\s*[·|,;]\s*|\s+/);
  return partes.some((p) => p === mNivel);
}
