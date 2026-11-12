import { palabrasDeNombre } from "../origen/identidad-nombres-producto";

/**
 * REQ-287: la especificación que el modelo leyó del documento viaja en `Especificacion` del
 * renglón de origen_correo. Aquí se parte en frases (sin romper un paréntesis) para sumarla a la
 * línea sin repetir el envase, la madurez ni el domo que ya se resuelven por su lado.
 */

const FRASE_ENVASE =
  /(?:\d+\s*x\s*)?\b(?:cubetas?|gal[oó]n(?:es)?|bid[oó]n(?:es)?|cajas?|envases?)\s+de\s+\d+(?:[.,]\d+)?\s*(?:litros?|lts?|l|kg|g|gr|ml)\b/gi;

/** Frases de la especificación, separadas por «;», «·» o coma fuera de paréntesis. */
export function frasesDeEspecificacion(
  especificacion: string | null | undefined,
): string[] {
  const texto = (especificacion ?? "").replace(/\s+/g, " ").trim();
  if (!texto) return [];
  return texto
    .split(/\s*[;·]\s*|\s*,\s*(?![^()]*\))/)
    .map((frase) => frase.trim().replace(/[.,:]+$/, ""))
    .filter(Boolean);
}

/**
 * Quita de la frase el envase que ya trae la especificación calculada («18x cubeta de 10
 * litros»). Si no queda nada con significado, devuelve vacío.
 */
export function fraseSinEnvase(frase: string, hayEnvase: boolean): string {
  if (!hayEnvase) return frase;
  const resto = frase.replace(FRASE_ENVASE, " ").replace(/\s+/g, " ").trim();
  return palabrasDeNombre(resto).length === 0 ? "" : resto;
}

function quitarAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "");
}

function normalizarFrase(texto: string): string {
  return quitarAcentos(texto).toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Atributo que el cliente pidió: se muestra siempre, aunque también esté en Solicitado.
 * «sin …» cubre sin penacho, sin cáscara, sin semilla, etc.
 */
export function esAtributoPedido(frase: string): boolean {
  const n = normalizarFrase(frase);
  return /sin\s+\w+|limpio|en\s+bote|fresco|cubeta|gal[oó]n|envase|bid[oó]n|domo|madurez/.test(
    n,
  );
}

/**
 * True si el fragmento ya está dicho en Solicitado (substring o las mismas palabras).
 * Un fragmento sin palabras significativas («por kilo») solo cuenta si el texto lo contiene.
 */
export function fraseRedundanteConSolicitado(
  frase: string,
  solicitado: string | null | undefined,
): boolean {
  const f = normalizarFrase(frase);
  const s = normalizarFrase(solicitado ?? "");
  if (!f || !s) return false;
  if (s.includes(f)) return true;
  const palabras = palabrasDeNombre(frase);
  if (palabras.length === 0) return false;
  const enSolicitado = new Set(palabrasDeNombre(solicitado));
  return palabras.every((palabra) => enSolicitado.has(palabra));
}
