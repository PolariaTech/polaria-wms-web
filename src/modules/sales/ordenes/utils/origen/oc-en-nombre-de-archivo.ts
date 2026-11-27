/** Menos dígitos que esto no identifican una OC: se confundirían con cualquier número del nombre. */
const MIN_DIGITOS_OC = 4;
/** Con OC largas (4500140188) el nombre suele traer solo el final («OC-140188»): se compara este tramo. */
const DIGITOS_FINALES = 6;

/**
 * REQ-313: si el nombre de un adjunto trae el número de la OC. Un correo con varias OC se parte en
 * varias OV y cada una conserva todos los adjuntos; el nombre del archivo dice de cuál OC es.
 * Coincide cuando un tramo de dígitos del nombre es igual a los dígitos de la OC, o, con OC de 6
 * dígitos o más, cuando un tramo de 6 o más dígitos trae sus últimos 6 o termina la OC.
 */
export function nombreTraeOc(nombre: string, oc: string | null | undefined): boolean {
  const digitosOc = (oc ?? "").replace(/\D/g, "");
  if (digitosOc.length < MIN_DIGITOS_OC) return false;
  const tramos = nombre.match(/\d+/g) ?? [];
  const finales = digitosOc.slice(-DIGITOS_FINALES);
  return tramos.some((tramo) => {
    if (tramo === digitosOc) return true;
    if (digitosOc.length < DIGITOS_FINALES || tramo.length < DIGITOS_FINALES) return false;
    return tramo.includes(finales) || digitosOc.endsWith(tramo);
  });
}

/** El correo entero y las imágenes de la firma nunca son la OC. */
const NO_ES_OC_RE = /\.(eml|msg|png|jpe?g|gif|webp|svg|bmp|ics|txt)$/i;

/**
 * REQ-404: cuáles de los adjuntos de una OV son su OC. Primero los que el nombre trae. Si ninguno la
 * trae (el nombre está mal puesto: «…_4503002535» con la OC 4503002534 dentro del PDF), quedan los
 * que no nombran la OC de una OV hermana del mismo correo. Así el documento mal nombrado no se pierde
 * y el de la hermana no se le asigna a esta OV.
 */
export function documentosDeOc<T extends { nombre: string }>(
  docs: readonly T[],
  oc: string | null | undefined,
  ocsHermanas: readonly (string | null | undefined)[] = [],
): T[] {
  const candidatos = docs.filter((doc) => !NO_ES_OC_RE.test(doc.nombre.trim()));
  const propios = candidatos.filter((doc) => nombreTraeOc(doc.nombre, oc));
  if (propios.length > 0) return propios;
  const hermanas = ocsHermanas.filter(
    (otra): otra is string => Boolean(otra?.trim()) && otra !== oc,
  );
  return candidatos.filter((doc) => !hermanas.some((otra) => nombreTraeOc(doc.nombre, otra)));
}
