/**
 * Convierte "N envases de X unidad" a la cantidad/precio de la unidad del catálogo.
 *
 * Ej.: "1 galón de 5 litros" + catálogo LTR + precio 350/envase
 *   → cantidad 5 LTR, precio unitario 70.
 */

import {
  approx,
  ENVASE_RE,
  ENVASE_SIN_N_RE,
  familiaUnidadCatalogo,
  normalizarContenido,
  parseNum,
  quitarAcentos,
  roundQty,
  type FamiliaUnidad,
} from "./resolve-cantidad-envase-unidades";

export { familiaUnidadCatalogo };
export type { FamiliaUnidad };

export type EnvaseContenidoParseado = {
  /** Cuántos envases (galones, cubetas, cajas…). */
  envases: number;
  /** Contenido de cada envase en la unidad del contenido. */
  contenidoPorEnvase: number;
  familiaContenido: FamiliaUnidad;
  frase: string;
};

export type CantidadEnvaseResuelta = {
  cantidad: number;
  precioUnitario: number | null;
  envases: number;
  contenidoPorEnvase: number;
  familia: FamiliaUnidad;
  frase: string;
};

/**
 * Detecta "N envase de X unidad" (o "envase de X unidad") en el texto del cliente.
 */
export function parseEnvaseContenidoDesdeTexto(
  texto: string | null | undefined,
): EnvaseContenidoParseado | null {
  const original = (texto ?? "").trim();
  if (!original) return null;
  // Sin acentos para matchear galón/cubeta/etc. de forma estable.
  const raw = quitarAcentos(original);

  const m = ENVASE_RE.exec(raw);
  if (m) {
    const envases = parseNum(m[1]!);
    const contenidoRaw = parseNum(m[3]!);
    if (envases == null || contenidoRaw == null) return null;
    const { valor, familia } = normalizarContenido(contenidoRaw, m[4]!);
    if (familia === "unknown") return null;
    return {
      envases,
      contenidoPorEnvase: valor,
      familiaContenido: familia,
      frase: m[0]!,
    };
  }

  const m2 = ENVASE_SIN_N_RE.exec(raw);
  if (m2) {
    const contenidoRaw = parseNum(m2[2]!);
    if (contenidoRaw == null) return null;
    const { valor, familia } = normalizarContenido(contenidoRaw, m2[3]!);
    if (familia === "unknown") return null;
    return {
      envases: 1,
      contenidoPorEnvase: valor,
      familiaContenido: familia,
      frase: m2[0]!,
    };
  }

  return null;
}

/**
 * Si el catálogo vende en la misma familia que el contenido del envase,
 * convierte cantidad (a contenido) y precio (de por-envase a por-unidad).
 * No toca líneas ya convertidas.
 */
export function resolveCantidadPrecioDesdeEnvase(params: {
  textoOriginal: string | null | undefined;
  unidadMedidaCatalogo: string | null | undefined;
  /** Cantidad que trajo Mateo / origen (suele ser # de envases). */
  cantidadRaw: number | null | undefined;
  /** Precio del documento (casi siempre por envase/UN). */
  precioDoc: number | null | undefined;
}): CantidadEnvaseResuelta | null {
  const parsed = parseEnvaseContenidoDesdeTexto(params.textoOriginal);
  if (!parsed) return null;

  const familiaCat = familiaUnidadCatalogo(params.unidadMedidaCatalogo);
  if (familiaCat === "unknown" || familiaCat !== parsed.familiaContenido) {
    return null;
  }

  const cantidadRaw =
    params.cantidadRaw != null && Number.isFinite(params.cantidadRaw)
      ? params.cantidadRaw
      : null;

  const texto = quitarAcentos(params.textoOriginal ?? "");
  const patronConN = ENVASE_RE.test(texto);

  // Envases: N del texto; si la frase solo describe el envase ("galón de 5 L")
  // y la cantidad cruda es el conteo de la PO (8 PZ), usa esa cantidad.
  let envases = parsed.envases;
  const cantidadEnteraEnvases =
    cantidadRaw != null &&
    approx(cantidadRaw, Math.round(cantidadRaw)) &&
    Math.round(cantidadRaw) >= 1
      ? Math.round(cantidadRaw)
      : null;
  const cantidadPareceConteoEnvases =
    cantidadEnteraEnvases != null &&
    !approx(cantidadEnteraEnvases, parsed.contenidoPorEnvase) &&
    !approx(
      cantidadEnteraEnvases,
      cantidadEnteraEnvases * parsed.contenidoPorEnvase,
    );

  if (!patronConN && cantidadPareceConteoEnvases && cantidadEnteraEnvases != null) {
    envases = cantidadEnteraEnvases;
  } else if (patronConN && cantidadRaw != null && approx(cantidadRaw, parsed.envases)) {
    envases = parsed.envases;
  } else if (patronConN && cantidadPareceConteoEnvases && cantidadEnteraEnvases != null) {
    // REQ-311: "1 galón de 5 L" en texto + qty 8 de la PO → 8 envases, no 1.
    envases = cantidadEnteraEnvases;
  } else if (patronConN) {
    envases = parsed.envases;
  } else if (cantidadPareceConteoEnvases && cantidadEnteraEnvases != null) {
    envases = cantidadEnteraEnvases;
  }

  const cantidadObjetivo = roundQty(envases * parsed.contenidoPorEnvase);

  // Ya estaba en unidad de contenido → no re-convertir (evita 70/5 = 14).
  if (cantidadRaw != null && approx(cantidadRaw, cantidadObjetivo)) {
    return null;
  }

  // Solo convertimos si la cantidad cruda es # envases (o viene vacía).
  if (
    cantidadRaw != null &&
    !approx(cantidadRaw, envases) &&
    !(envases === 1 && approx(cantidadRaw, 1))
  ) {
    return null;
  }

  const precioDoc =
    params.precioDoc != null &&
    Number.isFinite(params.precioDoc) &&
    params.precioDoc > 0
      ? params.precioDoc
      : null;

  const precioUnitario =
    precioDoc != null
      ? roundQty(precioDoc / parsed.contenidoPorEnvase)
      : null;

  return {
    cantidad: cantidadObjetivo,
    precioUnitario,
    envases,
    contenidoPorEnvase: parsed.contenidoPorEnvase,
    familia: parsed.familiaContenido,
    frase: parsed.frase,
  };
}

function nombreEnvaseDesdeFrase(frase: string): string {
  const f = quitarAcentos(frase);
  if (/\bgalon(?:es)?\b|\bgal\.?\b/.test(f)) return "galón";
  if (/\bcubeta(?:s)?\b/.test(f)) return "cubeta";
  if (/\bbidon(?:es)?\b/.test(f)) return "bidón";
  if (/\bgarrafa(?:s)?\b/.test(f)) return "garrafa";
  if (/\bbotella(?:s)?\b/.test(f)) return "botella";
  if (/\bcaja(?:s)?\b|\bcja\.?\b/.test(f)) return "caja";
  if (/\bsaco(?:s)?\b/.test(f)) return "saco";
  if (/\bbolsa(?:s)?\b/.test(f)) return "bolsa";
  if (/\benvase(?:s)?\b/.test(f)) return "envase";
  return "envase";
}

function formatContenido(n: number): string {
  const rounded = roundQty(n);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

/**
 * REQ-124: frase legible para Especificación, ej. "2x galón de 5 litros".
 */
export function formatEspecificacionEnvase(
  resolved: Pick<
    CantidadEnvaseResuelta,
    "envases" | "contenidoPorEnvase" | "familia" | "frase"
  >,
): string {
  const nombre = nombreEnvaseDesdeFrase(resolved.frase);
  const contenido = formatContenido(resolved.contenidoPorEnvase);
  const unidad =
    resolved.familia === "ltr"
      ? Number(contenido) === 1
        ? "litro"
        : "litros"
      : resolved.familia === "kg"
        ? "kg"
        : Number(contenido) === 1
          ? "pieza"
          : "piezas";
  return `${resolved.envases}x ${nombre} de ${contenido} ${unidad}`;
}

export {
  extractDomoEspecificacion,
  extractMadurezEspecificacion,
} from "./especificacion-madurez-domo";
