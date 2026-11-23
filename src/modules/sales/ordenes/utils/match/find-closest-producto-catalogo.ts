export { shouldAutoAcceptProductoSuggestion } from "./should-auto-accept-producto";

export { productoPreparacionIncompatibleConTexto } from "./producto-preparacion-incompatible";

export type {
  ProductoCatalogoMatchResult,
  ProductoCatalogoScored,
} from "./producto-catalogo-match-types";

export { codigoCoincideEnQuery } from "./codigo-coincide-en-query";

export { esProductoNoMercancia } from "./es-producto-no-mercancia";

export { productosFamiliasSinonimoConflictivas } from "./producto-familias-sinonimo-conflictivas";

export {
  matchesProductoCatalogSearch,
  unmatchedDistinctiveQueryTokens,
} from "./matches-producto-catalog-search";

export { productoCompatibleConTextoCliente } from "./producto-compatible-con-texto-cliente";

export { scoreProductoMatch } from "./score-producto-match";

export {
  coreProductNameForMatch,
  productNamesLooselyMatch,
} from "./producto-catalogo-names";

export {
  findClosestProductoCatalogo,
  findTypoRivalProductos,
  rankProductosCatalogo,
} from "./rank-productos-catalogo";