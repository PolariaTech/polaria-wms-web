import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import {
  codigoCoincideEnQuery,
  coreProductNameForMatch,
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

/** Igual que rankProductosCatalogo, pero sin los productos de otra familia que solo coinciden por calificativos. */
export function rankSinFamiliaAjena(
  consulta: string,
  productos: readonly ProductoVentaOption[],
  options?: { limit?: number; minScore?: number },
) {
  const consultaConPimiento = consulta.replace(
    /\bpimientos?\b/gi,
    "chile morron",
  );
  return rankProductosCatalogo(
    consultaConPimiento,
    productos.filter(
      (producto) => !sustantivoPrincipalAusente(consultaConPimiento, producto),
    ),
    options,
  );
}
