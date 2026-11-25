/**
 * REQ-363 / REQ-346: atributos en el nombre solicitado que deben ir a
 * especificación cuando Mateo no los extrajo aparte.
 * General: cualquier pedido (calibre, calidad, «sin …»), no un cliente concreto.
 */

function quitarAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Quita de la especificación unidades sueltas tipo «KG» / «20 KGM». */
function esSoloUnidadOCantidadUnidad(frase: string): boolean {
  return /^(?:\d+(?:[.,]\d+)?\s*)?(?:KGM|KG|LTR|L|PZA|PZ|UN)\.?$/i.test(
    frase.trim(),
  );
}

/**
 * Calibre/talla: «DE 24 A 30 CM», «15 CM», «DE 210 A 230 GR».
 * Simple solo CM/GR (no «g» suelta) para no confundir con «Domo de 500 g».
 */
const RE_CALIBRE_RANGO =
  /\bDE\s+\d+(?:[.,]\d+)?\s+A\s+\d+(?:[.,]\d+)?\s*(?:CM|GR|G|MM)\b/gi;
const RE_CALIBRE_SIMPLE = /\b(?:DE\s+)?\d+(?:[.,]\d+)?\s*(?:CM|GR)\b/gi;

function normalizarFrase(frase: string): string {
  return quitarAcentos(frase).toLowerCase().trim();
}

function pushUnico(out: string[], frase: string): void {
  const key = normalizarFrase(frase);
  if (!key) return;
  if (out.some((p) => normalizarFrase(p) === key)) return;
  out.push(frase.trim());
}

/** Extrae frases de calibre/talla del nombre del artículo (cualquier cliente). */
export function calibresDesdeSolicitado(
  textoSolicitado: string | null | undefined,
): string[] {
  const texto = (textoSolicitado ?? "").replace(/\s+/g, " ").trim();
  if (!texto) return [];
  const out: string[] = [];
  for (const match of texto.matchAll(RE_CALIBRE_RANGO)) {
    pushUnico(out, match[0] ?? "");
  }
  const sinRangos = texto.replace(RE_CALIBRE_RANGO, " ");
  for (const match of sinRangos.matchAll(RE_CALIBRE_SIMPLE)) {
    pushUnico(out, match[0] ?? "");
  }
  return out;
}

/**
 * Extrae frases de calidad / calibre desde el texto solicitado:
 * - calibre/talla sueltos: «DE 24 A 30 CM», «15 CM»
 * - contenido entre paréntesis: «(Sin Oxidacion)»
 * - «sin …» suelto fuera de paréntesis
 * No repite lo que ya está en el nombre de catálogo (p. ej. «SIN SEMILLA»).
 */
export function atributosCalidadDesdeSolicitado(
  textoSolicitado: string | null | undefined,
  opts?: { nombreCatalogo?: string | null },
): string[] {
  const texto = (textoSolicitado ?? "").replace(/\s+/g, " ").trim();
  if (!texto) return [];
  const catalogNorm = quitarAcentos(opts?.nombreCatalogo ?? "")
    .toLowerCase()
    .trim();

  const yaEnCatalogo = (frase: string) => {
    if (!catalogNorm) return false;
    return catalogNorm.includes(quitarAcentos(frase).toLowerCase());
  };

  const out: string[] = [];

  for (const calibre of calibresDesdeSolicitado(texto)) {
    if (yaEnCatalogo(calibre)) continue;
    pushUnico(out, calibre);
  }

  const paren = [...texto.matchAll(/\(([^)]+)\)/g)];
  for (const match of paren) {
    const frase = (match[1] ?? "").trim().replace(/[.,:]+$/, "");
    if (!frase || esSoloUnidadOCantidadUnidad(frase)) continue;
    if (/^\d+$/.test(frase)) continue;
    const normalizado = quitarAcentos(frase).toLowerCase();
    if (/^domo\b/.test(normalizado)) continue;
    if (/^madurez\b/.test(normalizado)) continue;
    // Calibre entre paréntesis: ya lo cubre calibresDesdeSolicitado.
    if (
      /^(?:de\s+)?\d+(?:[.,]\d+)?(?:\s*(?:a|-|–)\s*\d+(?:[.,]\d+)?)?\s*(?:cm|gr|g|mm)$/i.test(
        normalizado,
      )
    ) {
      continue;
    }
    if (yaEnCatalogo(frase)) continue;
    pushUnico(out, frase);
  }

  const sinMatch = texto.match(/\bsin\s+[\wáéíóúñ]+(?:\s+[\wáéíóúñ]+){0,3}/i);
  if (sinMatch?.[0]) {
    const frase = sinMatch[0].trim();
    if (!yaEnCatalogo(frase)) pushUnico(out, frase);
  }

  return out;
}
