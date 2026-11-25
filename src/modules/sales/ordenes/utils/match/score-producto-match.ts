import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { normalizeForMatch } from "./normalize-for-match";
import { codigoCoincideEnQuery } from "./codigo-coincide-en-query";
import { VARIANT_QUALIFIER_TOKENS } from "./producto-catalogo-synonyms";
import {
  expandQueryTokenForms,
  expandProductTokenForms,
  expandTokenForms,
  formsOverlap,
  productSearchText,
  tokenList,
  tokenSet,
  tokensNearlyEqual,
} from "./producto-catalogo-tokens";

export function scoreProductoMatch(
  query: string,
  producto: ProductoVentaOption,
): number {
  const q = normalizeForMatch(query);
  if (!q) return 0;

  const nombre = normalizeForMatch(producto.nombre);
  const codigo = normalizeForMatch(producto.codigo);
  const equivalencia = normalizeForMatch(producto.equivalencia ?? "");
  const label = normalizeForMatch(productSearchText(producto));

  if (q === nombre || q === codigo || q === label || (equivalencia && q === equivalencia)) {
    return 1;
  }
  if (codigoCoincideEnQuery(query, producto.codigo)) {
    return 0.95;
  }

  const qTokens = tokenSet(query);
  const pTokens = tokenSet(productSearchText(producto));
  if (qTokens.size === 0 || pTokens.size === 0) return 0;

  const qForms = expandQueryTokenForms(query);
  const pForms = expandProductTokenForms(productSearchText(producto));

  let overlap = 0;
  let synonymHits = 0;
  let softHits = 0;
  let matchedQueryTokens = 0;

  for (const token of qTokens) {
    const tokenForms = expandTokenForms(token);
    if ([...tokenForms].some((f) => pTokens.has(f) || pForms.has(f))) {
      const exactOnProduct = pTokens.has(token);
      overlap += exactOnProduct
        ? /^\d+$/.test(token) || token.length <= 4
          ? 1.35
          : 1
        : 0.95;
      if (!exactOnProduct) synonymHits += 1;
      matchedQueryTokens += 1;
      continue;
    }

    if (formsOverlap(tokenForms, pForms)) {
      overlap += 0.95;
      synonymHits += 1;
      matchedQueryTokens += 1;
      continue;
    }

    let matchedSoft = false;
    for (const pToken of pTokens) {
      if (tokensNearlyEqual(token, pToken)) {
        overlap += 0.92;
        matchedSoft = true;
        softHits += 1;
        break;
      }
      if (
        token.length >= 4 &&
        pToken.length > token.length &&
        pToken.startsWith(token)
      ) {
        overlap += 0.9;
        matchedSoft = true;
        softHits += 1;
        break;
      }
      if (token.length >= 3 && pToken.includes(token)) {
        overlap += 0.6;
        matchedSoft = true;
        softHits += 1;
        break;
      }
      if (pToken.length >= 3 && token.includes(pToken)) {
        overlap += 0.5;
        matchedSoft = true;
        softHits += 1;
        break;
      }
    }
    if (matchedSoft) matchedQueryTokens += 1;
  }

  const rawTokens = tokenList(query);
  for (let i = 0; i < rawTokens.length - 1; i += 1) {
    const compound = `${rawTokens[i]}${rawTokens[i + 1]}`;
    const compoundForms = expandTokenForms(compound);
    if (formsOverlap(compoundForms, pForms) || formsOverlap(compoundForms, pTokens)) {
      overlap += 0.85;
      synonymHits += 1;
    }
  }

  const union = qTokens.size + pTokens.size - Math.min(overlap, qTokens.size);
  let score = Math.min(1, overlap / Math.max(union, 1));

  if (synonymHits > 0) {
    score = Math.max(score, Math.min(0.72, 0.45 + 0.2 * synonymHits));
  }

  const queryCoverage = matchedQueryTokens / Math.max(qTokens.size, 1);
  if (queryCoverage >= 0.99 && (softHits > 0 || synonymHits > 0)) {
    score = Math.max(score, 0.55);
  } else if (queryCoverage >= 0.75 && matchedQueryTokens >= 2) {
    score = Math.max(score, 0.4);
  }

  const numericQuery = [...qTokens].filter((t) => /^\d+$/.test(t));
  if (numericQuery.length > 0) {
    const missing = numericQuery.filter((t) => !pTokens.has(t));
    if (missing.length > 0) {
      score *= 1 - 0.22 * missing.length;
    }
  }

  if (nombre.includes(q) || q.includes(nombre)) {
    score = Math.max(score, 0.55);
  }
  if (equivalencia && (equivalencia.includes(q) || q.includes(equivalencia))) {
    score = Math.max(score, 0.6);
  }
  if (label.includes(q)) {
    score = Math.max(score, 0.5);
  }
  for (const form of qForms) {
    if (form.length >= 5 && (nombre.includes(form) || label.includes(form))) {
      score = Math.max(score, 0.58);
      break;
    }
  }

  const qRaw = tokenSet(query);
  const pRaw = tokenSet(productSearchText(producto));
  const extraQualifiers = [...pRaw].filter(
    (t) => VARIANT_QUALIFIER_TOKENS.has(t) && !qRaw.has(t),
  );
  if (extraQualifiers.length > 0) {
    score *= 1 - 0.18 * Math.min(extraQualifiers.length, 2);
  }

  return Math.max(0, Math.min(1, score));
}