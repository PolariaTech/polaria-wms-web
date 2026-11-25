import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { productoCompatibleConTextoCliente } from "./producto-compatible-con-texto-cliente";
import { unmatchedDistinctiveQueryTokens } from "./matches-producto-catalog-search";
import {
  AMBIGUITY_GAP,
  MAX_CANDIDATES,
  MAX_FAMILY_CANDIDATES,
  MIN_SUGGESTION_SCORE,
  type ProductoCatalogoMatchResult,
  type ProductoCatalogoScored,
} from "./producto-catalogo-match-types";
import {
  productoMatchesQueryToken,
  productSearchText,
  tokenList,
  tokensNearlyEqual,
} from "./producto-catalogo-tokens";
import { productoPreparacionIncompatibleConTexto } from "./producto-preparacion-incompatible";
import { esProductoNoMercancia } from "./es-producto-no-mercancia";
import { scoreProductoMatch } from "./score-producto-match";

export function rankProductosCatalogo(
  query: string,
  productos: readonly ProductoVentaOption[],
  options?: { limit?: number; minScore?: number },
): ProductoCatalogoMatchResult {
  const limit = options?.limit ?? MAX_CANDIDATES;
  const minScore = options?.minScore ?? MIN_SUGGESTION_SCORE;

  if (!query.trim() || productos.length === 0) {
    return { best: null, candidates: [], ambiguous: false };
  }

  const scored: ProductoCatalogoScored[] = [];
  for (const producto of productos) {
    if (productoPreparacionIncompatibleConTexto(query, producto)) {
      continue;
    }
    let score = scoreProductoMatch(query, producto);
    if (esProductoNoMercancia(producto) && !productoCompatibleConTextoCliente(query, producto)) {
      continue;
    }
    if (esProductoNoMercancia(producto)) {
      score = Math.min(score, 0.4);
    }
    if (score >= minScore) {
      scored.push({ producto, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.producto.nombre.localeCompare(b.producto.nombre, "es");
  });

  const top = scored[0];
  if (!top) {
    return { best: null, candidates: [], ambiguous: false };
  }

  const topScore = top.score;
  const nearTop = scored.filter(
    (row) => topScore - row.score < AMBIGUITY_GAP && row.score >= minScore,
  );
  const qTokens = tokenList(query);
  const anchorTokens = qTokens.filter((t) =>
    productoMatchesQueryToken(top.producto, t),
  );
  const unmatched = unmatchedDistinctiveQueryTokens(query, top.producto);

  const needsFamilyExpand =
    nearTop.length >= 2 ||
    (unmatched.length > 0 && anchorTokens.length > 0);

  let candidates: ProductoCatalogoScored[];
  if (needsFamilyExpand && anchorTokens.length > 0) {
    const family = scored.filter((row) =>
      anchorTokens.some((a) => productoMatchesQueryToken(row.producto, a)),
    );
    candidates = family.slice(
      0,
      Math.max(limit, Math.min(family.length, MAX_FAMILY_CANDIDATES)),
    );
  } else {
    candidates = scored.slice(0, limit);
  }

  const best = candidates[0]?.producto ?? null;
  const second = candidates[1];
  const scoreAmbiguous = Boolean(
    candidates[0] &&
      second &&
      candidates[0].score - second.score < AMBIGUITY_GAP &&
      second.score >= minScore,
  );
  const ambiguous =
    scoreAmbiguous || (needsFamilyExpand && candidates.length > 1);

  return { best, candidates, ambiguous };
}

export function findClosestProductoCatalogo(
  query: string,
  productos: readonly ProductoVentaOption[],
): ProductoVentaOption | null {
  const result = rankProductosCatalogo(query, productos);
  if (!result.best) return null;
  return result.best;
}

export function findTypoRivalProductos(
  query: string,
  chosen: ProductoVentaOption,
  productos: readonly ProductoVentaOption[],
): ProductoVentaOption[] {
  const qTokens = tokenList(query);
  if (qTokens.length === 0) return [];

  const chosenTokens = tokenList(productSearchText(chosen));
  const rivals: ProductoVentaOption[] = [];

  for (const other of productos) {
    if (other.idProducto === chosen.idProducto) continue;
    const otherTokens = tokenList(productSearchText(other));

    const sharesFamily = qTokens.some(
      (qt) => chosenTokens.includes(qt) && otherTokens.includes(qt),
    );

    let typoRival = false;
    for (const qt of qTokens) {
      const exactChosen = chosenTokens.includes(qt);
      const softOther = otherTokens.some(
        (ot) => ot !== qt && tokensNearlyEqual(qt, ot),
      );
      if (exactChosen && softOther) {
        typoRival = true;
        break;
      }
      const softChosen = chosenTokens.some(
        (ct) => ct !== qt && tokensNearlyEqual(qt, ct),
      );
      const exactOther = otherTokens.includes(qt);
      if (softChosen && exactOther) {
        typoRival = true;
        break;
      }
    }

    if (typoRival && sharesFamily) {
      rivals.push(other);
    }
  }

  rivals.sort(
    (a, b) => scoreProductoMatch(query, b) - scoreProductoMatch(query, a),
  );
  return rivals.slice(0, 2);
}