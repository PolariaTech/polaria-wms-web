import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { normalizeForMatch } from "./normalize-for-match";
import {
  expandTokenForms,
  productoMatchesQueryToken,
  tokenList,
} from "./producto-catalogo-tokens";

export function unmatchedDistinctiveQueryTokens(
  query: string,
  producto: ProductoVentaOption,
): string[] {
  return tokenList(query).filter(
    (t) =>
      t.length >= 4 &&
      !/^\d+$/.test(t) &&
      !productoMatchesQueryToken(producto, t),
  );
}

export function matchesProductoCatalogSearch(
  query: string,
  producto: {
    nombre?: string | null;
    codigo?: string | null;
    equivalencia?: string | null;
  },
): boolean {
  const needle = normalizeForMatch(query);
  if (!needle) return true;

  const haystack = normalizeForMatch(
    `${producto.nombre ?? ""} ${producto.codigo ?? ""} ${producto.equivalencia ?? ""}`,
  );
  if (!haystack) return false;
  if (haystack.includes(needle)) return true;

  const tokens = needle.split(" ").filter((t) => t.length >= 2);
  if (tokens.length === 0) return true;

  const tokenMatched = (token: string): boolean => {
    if (haystack.includes(token)) return true;
    for (const form of expandTokenForms(token)) {
      if (form.length >= 3 && haystack.includes(form)) return true;
    }
    return false;
  };

  const matched = tokens.filter(tokenMatched);
  if (matched.length === tokens.length) return true;
  if (matched.some((t) => t.length >= 4)) return true;
  if (tokens.length >= 2 && matched.length >= tokens.length - 1) return true;
  return false;
}