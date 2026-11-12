/**
 * REQ-309: identidad de un nombre de producto frente a otro del mismo documento.
 * «Chile morrón verde» y «Chile morrón rojo» comparten casi todo: lo único que los separa es el
 * color, así que un color distinto descarta el emparejamiento aunque el resto coincida.
 */

const PALABRAS_VACIAS = new Set([
  "de", "del", "la", "el", "los", "las", "por", "con", "sin", "en", "kilo", "kilos", "kg", "pza", "pzas",
]);

const RAICES_COLOR: ReadonlyArray<readonly [string, RegExp]> = [
  ["rojo", /^roj[oa]s?$/],
  ["verde", /^verdes?$/],
  ["amarillo", /^amarill[oa]s?$/],
  ["blanco", /^blanc[oa]s?$/],
  ["negro", /^negr[oa]s?$/],
  ["morado", /^morad[oa]s?$/],
  ["azul", /^azul(?:es)?$/],
];

function quitarAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Palabras significativas del nombre: sin acentos, sin plural simple y sin conectores. */
export function palabrasDeNombre(texto: string | null | undefined): string[] {
  return quitarAcentos(texto ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((palabra) => palabra.length >= 3 && !PALABRAS_VACIAS.has(palabra))
    .map((palabra) => (palabra.length > 4 && palabra.endsWith("s") ? palabra.slice(0, -1) : palabra));
}

/** Colores que nombra el texto (rojo, verde…), en su forma masculina singular. */
export function coloresDeNombre(texto: string | null | undefined): Set<string> {
  const colores = new Set<string>();
  const crudas = quitarAcentos(texto ?? "").toLowerCase().split(/[^a-z0-9]+/);
  for (const palabra of crudas) {
    const hit = RAICES_COLOR.find(([, re]) => re.test(palabra));
    if (hit) colores.add(hit[0]);
  }
  return colores;
}

/** True si los dos nombres nombran colores y no comparten ninguno (verde ≠ rojo). */
export function nombresContradicenPorColor(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const ca = coloresDeNombre(a);
  const cb = coloresDeNombre(b);
  if (ca.size === 0 || cb.size === 0) return false;
  return ![...ca].some((color) => cb.has(color));
}

/** Los dos nombres tienen las mismas palabras significativas (sin importar el orden). */
export function nombresIguales(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const pa = [...new Set(palabrasDeNombre(a))].sort();
  const pb = [...new Set(palabrasDeNombre(b))].sort();
  return pa.length > 0 && pa.length === pb.length && pa.every((p, i) => p === pb[i]);
}

/**
 * Parecido entre dos nombres: palabras comunes / palabras del más corto (0 a 1).
 * -1 si se contradicen por color.
 */
export function afinidadDeNombres(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  if (nombresContradicenPorColor(a, b)) return -1;
  const pa = new Set(palabrasDeNombre(a));
  const pb = new Set(palabrasDeNombre(b));
  if (pa.size === 0 || pb.size === 0) return 0;
  let comunes = 0;
  for (const palabra of pa) if (pb.has(palabra)) comunes += 1;
  return comunes / Math.min(pa.size, pb.size);
}
