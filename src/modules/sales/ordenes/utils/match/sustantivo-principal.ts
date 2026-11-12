import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import {
  codigoCoincideEnQuery,
  coreProductNameForMatch,
  esProductoNoMercancia,
  productoPreparacionIncompatibleConTexto,
  rankProductosCatalogo,
  unmatchedDistinctiveQueryTokens,
} from "./find-closest-producto-catalogo";

/** Palabras que califican (calidad, color, presentación): nunca son el sustantivo del producto. */
const CALIFICATIVOS = new Set([
  "primera",
  "segunda",
  "tercera",
  "extra",
  "super",
  "mediano",
  "mediana",
  "grande",
  "chico",
  "chica",
  "rojo",
  "roja",
  "rojos",
  "rojas",
  "verde",
  "verdes",
  "amarillo",
  "amarilla",
  "blanco",
  "blanca",
  "morado",
  "morada",
  "negro",
  "negra",
  "dulce",
  "bote",
  "domo",
  "proceso",
  "congelado",
  "congelada",
  "congelados",
  "congeladas",
  "fresco",
  "fresca",
  "limpio",
  "limpia",
]);
const VACIAS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "y",
  "en",
  "a",
  "al",
  "por",
  "para",
  "con",
  "sin",
]);

function tokensDeNombre(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 0 && !VACIAS.has(token));
}

/** Primer sustantivo del nombre del catálogo (en español va primero): «AGUACATE PRIMERA» → aguacate. */
function sustantivoPrincipal(nombre: string): string | null {
  const nucleo = coreProductNameForMatch(nombre);
  return (
    tokensDeNombre(nucleo).find(
      (token) =>
        token.length >= 3 && !/^\d+$/.test(token) && !CALIFICATIVOS.has(token),
    ) ?? null
  );
}

/**
 * El producto trae un sustantivo (aguacate, pulpa, chile…) que el cliente no escribió Y el cliente
 * escribió otro sustantivo que el producto no tiene: la coincidencia es solo por calificativos
 * (primera, rojo…) y es de otra familia. No se debe sugerir ni auto-asignar.
 */
export function sustantivoPrincipalAusente(
  texto: string | null | undefined,
  producto: ProductoVentaOption,
): boolean {
  const textoLimpio = coreProductNameForMatch(texto ?? "");
  const sustantivo = sustantivoPrincipal(producto.nombre ?? "");
  if (
    !textoLimpio ||
    !sustantivo ||
    codigoCoincideEnQuery(texto ?? "", producto.codigo)
  ) {
    return false;
  }
  const productoConTextoCliente = {
    ...producto,
    nombre: textoLimpio,
    codigo: "",
    equivalencia: "",
  };
  const sustantivoCubierto =
    sustantivo.length >= 4
      ? unmatchedDistinctiveQueryTokens(sustantivo, productoConTextoCliente)
          .length === 0
      : tokensDeNombre(textoLimpio).some(
          (token) => token === sustantivo || token === `${sustantivo}s`,
        );
  if (sustantivoCubierto) return false;
  return unmatchedDistinctiveQueryTokens(textoLimpio, producto).some(
    (token) => !CALIFICATIVOS.has(token),
  );
}

type NombreTokens = { producto: ProductoVentaOption; tokens: string[] };

function palabrasDelNombre(nombre: string): string[] {
  const tokens = tokensDeNombre(coreProductNameForMatch(nombre));
  return [...new Set(tokens.filter((token) => !/^\d+$/.test(token)))];
}

/** Misma palabra salvo plural simple (tomate/tomates, limon/limones). Sin sinónimos: jitomate no es tomate. */
function mismaPalabra(a: string, b: string): boolean {
  return a === b || `${a}s` === b || `${b}s` === a || `${a}es` === b || `${b}es` === a;
}

function incluidoEn(parte: string[], todo: string[]): boolean {
  return parte.every((p) => todo.some((t) => mismaPalabra(p, t)));
}

/**
 * Único producto de nombre compuesto (2+ palabras) cuyo nombre COMPLETO está escrito en el texto
 * («Tomate verde limpio» → TOMATE VERDE, «Melon Chino 3 kg» → MELON CHINO), sin otro producto del
 * mismo texto en competencia ni variante más específica en el catálogo. Compara palabras literales,
 * no sinónimos, y exige que el sustantivo del texto esté en el nombre. Si no es claro: null.
 */
export function productoConNombreCompletoEnTexto(
  texto: string,
  productos: readonly ProductoVentaOption[],
): ProductoVentaOption | null {
  const palabrasTexto = palabrasDelNombre(texto);
  const cabeza = palabrasTexto.find(
    (token) => token.length >= 3 && !CALIFICATIVOS.has(token),
  );
  if (!cabeza) return null;
  const todos: NombreTokens[] = productos.map((producto) => ({
    producto,
    tokens: palabrasDelNombre(producto.nombre ?? ""),
  }));
  const mayorQue = (y: NombreTokens, x: NombreTokens) =>
    y !== x && y.tokens.length > x.tokens.length && incluidoEn(x.tokens, y.tokens);
  const escritos = todos.filter(
    (x) =>
      x.tokens.length > 0 &&
      incluidoEn(x.tokens, palabrasTexto) &&
      !esProductoNoMercancia(x.producto) &&
      !productoPreparacionIncompatibleConTexto(texto, x.producto),
  );
  const maximos = escritos.filter((x) => !escritos.some((y) => mayorQue(y, x)));
  const unico = maximos.length === 1 ? maximos[0]! : null;
  if (!unico || unico.tokens.length < 2) return null;
  if (!unico.tokens.some((token) => mismaPalabra(token, cabeza))) return null;
  return todos.some((y) => mayorQue(y, unico)) ? null : unico.producto;
}

/**
 * Igual que rankProductosCatalogo, pero sin los productos de otra familia que solo coinciden por
 * calificativos, y con el producto de nombre completo en el texto por delante (sin ambigüedad).
 */
export function rankSinFamiliaAjena(
  consulta: string,
  productos: readonly ProductoVentaOption[],
  options?: { limit?: number; minScore?: number },
) {
  const consultaConPimiento = consulta.replace(
    /\bpimientos?\b/gi,
    "chile morron",
  );
  const sinAjenos = productos.filter(
    (producto) => !sustantivoPrincipalAusente(consultaConPimiento, producto),
  );
  const ranked = rankProductosCatalogo(consultaConPimiento, sinAjenos, options);
  const claro = productoConNombreCompletoEnTexto(consultaConPimiento, sinAjenos);
  if (!claro) return ranked;
  const actual = ranked.candidates.find(
    (candidato) => candidato.producto.idProducto === claro.idProducto,
  );
  const resto = ranked.candidates.filter((candidato) => candidato !== actual);
  return {
    best: claro,
    candidates: [
      { producto: claro, score: Math.max(actual?.score ?? 0, 0.9) },
      ...resto,
    ].slice(0, Math.max(ranked.candidates.length, 1)),
    ambiguous: false,
  };
}
