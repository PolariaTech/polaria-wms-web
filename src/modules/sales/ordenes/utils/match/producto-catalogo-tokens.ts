import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { normalizeForMatch } from "./normalize-for-match";
import { STOP_TOKENS, SYNONYM_INDEX } from "./producto-catalogo-synonyms";

export function tokenList(value: string): string[] {
  return normalizeForMatch(value)
    .split(" ")
    .filter((t) => t.length > 0 && !STOP_TOKENS.has(t));
}

/** Singular/plural simple EN/ES para acercar berry↔berries, fresa↔fresas. */
export function stemVariants(token: string): string[] {
  const out = new Set<string>([token]);
  if (token.length < 4) return [...out];

  if (token.endsWith("ies") && token.length > 4) {
    out.add(`${token.slice(0, -3)}y`);
  }
  if (token.endsWith("oes") && token.length > 4) {
    out.add(token.slice(0, -2));
  }
  if (token.endsWith("es") && token.length > 4) {
    out.add(token.slice(0, -2));
    out.add(token.slice(0, -1));
  }
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) {
    out.add(token.slice(0, -1));
  }
  if (!token.endsWith("s")) {
    out.add(`${token}s`);
    out.add(`${token}es`);
    if (token.endsWith("y") && token.length > 3) {
      out.add(`${token.slice(0, -1)}ies`);
    }
  }
  return [...out];
}

export function expandTokenForms(token: string): Set<string> {
  const forms = new Set<string>();
  for (const stem of stemVariants(token)) {
    forms.add(stem);
    const group = SYNONYM_INDEX.get(stem);
    if (group) {
      for (const syn of group) forms.add(syn);
    }
  }
  const direct = SYNONYM_INDEX.get(token);
  if (direct) {
    for (const syn of direct) forms.add(syn);
  }
  return forms;
}

export function expandQueryTokenForms(query: string): Set<string> {
  const tokens = tokenList(query);
  const forms = new Set<string>();
  for (const token of tokens) {
    for (const form of expandTokenForms(token)) forms.add(form);
  }
  for (let i = 0; i < tokens.length - 1; i += 1) {
    const compound = `${tokens[i]}${tokens[i + 1]}`;
    for (const form of expandTokenForms(compound)) forms.add(form);
    const spaced = `${tokens[i]} ${tokens[i + 1]}`;
    void spaced;
  }
  return forms;
}

export function expandProductTokenForms(productoText: string): Set<string> {
  const tokens = tokenList(productoText);
  const forms = new Set<string>();
  for (const token of tokens) {
    for (const form of expandTokenForms(token)) forms.add(form);
  }
  return forms;
}

export function tokenSet(value: string): Set<string> {
  return new Set(tokenList(value));
}

export function productSearchText(producto: ProductoVentaOption): string {
  return `${producto.nombre} ${producto.codigo} ${producto.equivalencia ?? ""}`;
}

/** Distancia de edición acotada (útil para typos tipo jass/hass). */
export function editDistanceAtMost(a: string, b: string, max: number): boolean {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return false;
  if (la === 0 || lb === 0) return Math.max(la, lb) <= max;

  let prev = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i += 1) {
    const cur = new Array<number>(lb + 1);
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= lb; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(
        prev[j]! + 1,
        cur[j - 1]! + 1,
        prev[j - 1]! + cost,
      );
      rowMin = Math.min(rowMin, cur[j]!);
    }
    if (rowMin > max) return false;
    prev = cur;
  }
  return prev[lb]! <= max;
}

export function tokensNearlyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  if (/\d/.test(a) || /\d/.test(b)) return false;
  return editDistanceAtMost(a, b, 1);
}

export function formsOverlap(
  queryForms: Set<string>,
  productForms: Set<string>,
): boolean {
  for (const form of queryForms) {
    if (productForms.has(form)) return true;
  }
  return false;
}

export function productoMatchesQueryToken(
  producto: ProductoVentaOption,
  queryToken: string,
): boolean {
  const pTokens = tokenSet(productSearchText(producto));
  const pForms = expandProductTokenForms(productSearchText(producto));
  const forms = expandTokenForms(queryToken);
  if ([...forms].some((f) => pTokens.has(f) || pForms.has(f))) return true;
  for (const pToken of pTokens) {
    if (tokensNearlyEqual(queryToken, pToken)) return true;
    if (queryToken.length >= 4 && pToken.startsWith(queryToken)) return true;
  }
  return false;
}