import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { normalizeForMatch } from "./normalize-for-match";

export function indiceFrasesCliente(
  productos: readonly (ProductoVentaOption & {
    frasesCliente?: readonly string[];
  })[],
): Map<string, ProductoVentaOption | null> {
  const indice = new Map<string, ProductoVentaOption | null>();
  for (const producto of productos) {
    for (const frase of producto.frasesCliente ?? []) {
      const fraseNormalizada = normalizeForMatch(frase);
      if (!fraseNormalizada) continue;
      const existente = indice.get(fraseNormalizada);
      if (existente === undefined) {
        indice.set(fraseNormalizada, producto);
        continue;
      }
      if (existente !== null && existente.idProducto !== producto.idProducto) {
        indice.set(fraseNormalizada, null);
      }
    }
  }
  return indice;
}

export function productoPorFraseCliente(
  texto: string,
  indice: ReadonlyMap<string, ProductoVentaOption | null>,
): ProductoVentaOption | null {
  const fraseNormalizada = normalizeForMatch(texto);
  if (!fraseNormalizada) return null;
  return indice.get(fraseNormalizada) ?? null;
}
