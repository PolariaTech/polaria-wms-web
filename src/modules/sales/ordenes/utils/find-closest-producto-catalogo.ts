import type { ProductoVentaOption } from "../../shared/types/sales.types";

export interface ProductoCatalogoScored {
  producto: ProductoVentaOption;
  score: number;
}

export interface ProductoCatalogoMatchResult {
  /** Mejor candidato por encima del umbral mínimo, o null. */
  best: ProductoVentaOption | null;
  /** Hasta 3 candidatos ordenados (mejor primero). */
  candidates: ProductoCatalogoScored[];
  /**
   * Hay 2+ productos con score parecido: no conviene auto-asignar;
   * el usuario debe elegir entre alternativas.
   */
  ambiguous: boolean;
}

const MIN_SUGGESTION_SCORE = 0.22;
/** Gap mínimo entre 1.º y 2.º para considerar el match inequívoco. */
const AMBIGUITY_GAP = 0.1;
const MAX_CANDIDATES = 3;

/** Tokens demasiado genéricos para decidir entre variantes del mismo producto. */
const STOP_TOKENS = new Set([
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
  "kg",
  "kgs",
  "kilo",
  "kilos",
  "caja",
  "cajas",
  "pieza",
  "piezas",
  "unidad",
  "unidades",
  "pza",
  "pz",
  "gr",
  "g",
  "cm",
  "mm",
  "approx",
  "aprox",
  "premium",
  "fresco",
  "fresca",
  "frescos",
  "frescas",
  "congelado",
  "congelada",
  "congelados",
  "congeladas",
]);

/** Presentaciones/variantes: bajan score si el cliente no las pidió. */
const VARIANT_QUALIFIER_TOKENS = new Set([
  "congelado",
  "congelada",
  "congelados",
  "congeladas",
  "domo",
  "proceso",
  "procesos",
  "bote",
  "botes",
  "extra",
  "primera",
  "segunda",
  "tercera",
  "super",
]);

/**
 * Familias de sinónimos ES/EN (y variantes ortográficas) para que Mateo
 * entienda lo que escribe el cliente aunque el catálogo diga otra cosa.
 * Ej.: "blue berry" ↔ "arándanos/blueberries".
 */
const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ["arandano", "arandanos", "blueberry", "blueberries", "blueberrie"],
  ["frambuesa", "frambuesas", "raspberry", "raspberries"],
  ["fresa", "fresas", "strawberry", "strawberries"],
  // No usar "mora/moras": choca con "cebolla morada" por substring.
  ["zarzamora", "zarzamoras", "blackberry", "blackberries"],
  ["aguacate", "aguacates", "avocado", "avocados", "palta", "paltas"],
  ["platano", "platanos", "banana", "bananas", "banano", "bananos"],
  ["limon", "limones", "lemon", "lemons", "lima", "limas"],
  ["naranja", "naranjas", "orange", "oranges"],
  [
    "jitomate",
    "jitomates",
    "tomate",
    "tomates",
    "tomato",
    "tomatoes",
  ],
  ["cebolla", "cebollas", "onion", "onions"],
  ["ajo", "ajos", "garlic"],
  ["papa", "papas", "patata", "patatas", "potato", "potatoes"],
  ["sandia", "sandias", "watermelon", "watermelons"],
  ["pina", "pinas", "pineapple", "pineapples"],
  ["mango", "mangos", "mangoes"],
  ["kiwi", "kiwis"],
  ["brocoli", "broccoli"],
  ["coliflor", "cauliflower"],
  ["pepino", "pepinos", "cucumber", "cucumbers"],
  ["esparrago", "esparragos", "asparagus"],
  ["apio", "celery"],
  ["chile", "chiles", "pepper", "peppers", "morron"],
  ["guanabana", "soursop"],
  ["maracuya", "passionfruit", "passion"],
];

const SYNONYM_INDEX: Map<string, ReadonlySet<string>> = (() => {
  const map = new Map<string, ReadonlySet<string>>();
  for (const group of SYNONYM_GROUPS) {
    const normalized = group.map((t) => normalizeForMatch(t)).filter(Boolean);
    const set = new Set(normalized);
    for (const token of set) {
      map.set(token, set);
    }
  }
  return map;
})();

function normalizeForMatch(value: string): string {
  return value
    .trim()
    // Mojibake frecuente de ñ/Ñ en PDFs/correos del tercero (PI¥A → PIÑA).
    .replace(/¥/g, "ñ")
    .replace(/\uFFFD/g, "n")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\*/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenList(value: string): string[] {
  return normalizeForMatch(value)
    .split(" ")
    .filter((t) => t.length > 0 && !STOP_TOKENS.has(t));
}

/** Singular/plural simple EN/ES para acercar berry↔berries, fresa↔fresas. */
function stemVariants(token: string): string[] {
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
  // Generar plurales desde singular corto.
  if (!token.endsWith("s")) {
    out.add(`${token}s`);
    out.add(`${token}es`);
    if (token.endsWith("y") && token.length > 3) {
      out.add(`${token.slice(0, -1)}ies`);
    }
  }
  return [...out];
}

function expandTokenForms(token: string): Set<string> {
  const forms = new Set<string>();
  for (const stem of stemVariants(token)) {
    forms.add(stem);
    const group = SYNONYM_INDEX.get(stem);
    if (group) {
      for (const syn of group) forms.add(syn);
    }
  }
  // Si el token compuesto ya está en un grupo vía stem, ok; si no, probar group directo.
  const direct = SYNONYM_INDEX.get(token);
  if (direct) {
    for (const syn of direct) forms.add(syn);
  }
  return forms;
}

/**
 * Tokens del query ampliados: stems, sinónimos y compuestos adyacentes
 * ("blue"+"berry" → "blueberry" → familia arándanos).
 */
function expandQueryTokenForms(query: string): Set<string> {
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

function expandProductTokenForms(productoText: string): Set<string> {
  const tokens = tokenList(productoText);
  const forms = new Set<string>();
  for (const token of tokens) {
    for (const form of expandTokenForms(token)) forms.add(form);
  }
  // "arandanos/blueberries" ya se parte en dos tokens por normalize.
  return forms;
}

function tokenSet(value: string): Set<string> {
  return new Set(tokenList(value));
}

function productSearchText(producto: ProductoVentaOption): string {
  return `${producto.nombre} ${producto.codigo} ${producto.equivalencia ?? ""}`;
}

/** Distancia de edición acotada (útil para typos tipo jass/hass). */
function editDistanceAtMost(a: string, b: string, max: number): boolean {
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

function tokensNearlyEqual(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 4 || b.length < 4) return false;
  // SKUs numéricos (115001413 vs 115001414) no son typos de producto.
  if (/^\d+$/.test(a) || /^\d+$/.test(b)) return false;
  return editDistanceAtMost(a, b, 1);
}

function formsOverlap(
  queryForms: Set<string>,
  productForms: Set<string>,
): boolean {
  for (const form of queryForms) {
    if (productForms.has(form)) return true;
  }
  return false;
}

/**
 * Score 0–1: código exacto, overlap de tokens/sinónimos, substring.
 * Penaliza cuando el query trae tallas/números que el producto no tiene
 * (ej. "chile 6 a 8 cm" vs "chile 8 a 10 cm").
 */
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
  if (codigo && (q === codigo || q.includes(codigo) || codigo.includes(q))) {
    return 0.95;
  }

  const qTokens = tokenSet(query);
  const pTokens = tokenSet(productSearchText(producto));
  if (qTokens.size === 0 || pTokens.size === 0) return 0;

  const qForms = expandQueryTokenForms(query);
  const pForms = expandProductTokenForms(productSearchText(producto));

  let overlap = 0;
  let synonymHits = 0;

  for (const token of qTokens) {
    const tokenForms = expandTokenForms(token);
    if ([...tokenForms].some((f) => pTokens.has(f) || pForms.has(f))) {
      // Match directo o por sinónimo/stem.
      const exactOnProduct = pTokens.has(token);
      overlap += exactOnProduct
        ? /^\d+$/.test(token) || token.length <= 4
          ? 1.35
          : 1
        : 0.95;
      if (!exactOnProduct) synonymHits += 1;
      continue;
    }

    // Compuestos blue+berry ya están en qForms; si el producto tiene blueberries:
    if (formsOverlap(tokenForms, pForms)) {
      overlap += 0.95;
      synonymHits += 1;
      continue;
    }

    let matchedSoft = false;
    for (const pToken of pTokens) {
      if (tokensNearlyEqual(token, pToken)) {
        overlap += 0.92;
        matchedSoft = true;
        break;
      }
      // Prefijo truncado del tercero: "AGUAC" → "AGUACATE".
      if (
        token.length >= 4 &&
        pToken.length > token.length &&
        pToken.startsWith(token)
      ) {
        overlap += 0.9;
        matchedSoft = true;
        break;
      }
      if (token.length >= 3 && pToken.includes(token)) {
        overlap += 0.6;
        matchedSoft = true;
        break;
      }
      if (pToken.length >= 3 && token.includes(pToken)) {
        overlap += 0.5;
        matchedSoft = true;
        break;
      }
    }
    void matchedSoft;
  }

  // Bonus si el compuesto completo del query cae en el producto (blue berry → blueberry).
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

  // Empuje cuando hubo match por sinónimo/compuesto aunque Jaccard quede bajo
  // (query corto "blue berry" vs nombre largo "ARÁNDANOS/BLUEBERRIES (DOMO)").
  if (synonymHits > 0) {
    score = Math.max(score, Math.min(0.72, 0.45 + 0.2 * synonymHits));
  }

  // Penaliza tallas/números del pedido que el catálogo no trae (variantes distintas).
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
  // Substring por formas expandidas (blueberry dentro de blueberries).
  // Mínimo 5 letras: evita falsos como "mora" ⊂ "morada".
  for (const form of qForms) {
    if (form.length >= 5 && (nombre.includes(form) || label.includes(form))) {
      score = Math.max(score, 0.58);
      break;
    }
  }

  // Si el catálogo trae calificadores (congelada, domo…) que el cliente no escribió,
  // bajar score para preferir la variante “base” (ZARZAMORA vs ZARZAMORAS CONGELADAS).
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

/**
 * ¿El nombre del correo/cliente y el del catálogo hablan del mismo producto?
 * Usa sinónimos (blue berry ↔ arándanos/blueberries) además de overlap de tokens.
 */
export function productNamesLooselyMatch(a: string, b: string): boolean {
  const left = (a ?? "").trim();
  const right = (b ?? "").trim();
  if (!left || !right) return false;

  const na = normalizeForMatch(left);
  const nb = normalizeForMatch(right);
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;

  // Score simétrico con un producto sintético.
  const synthetic: ProductoVentaOption = {
    idProducto: "_",
    label: right,
    idCliente: null,
    idBodega: "",
    codigo: "",
    nombre: right,
    kgDisponible: 0,
    precioUnitario: 0,
    unidadMedida: "kg",
  };
  if (scoreProductoMatch(left, synthetic) >= 0.45) return true;

  const syntheticB: ProductoVentaOption = {
    ...synthetic,
    nombre: left,
    label: left,
  };
  return scoreProductoMatch(right, syntheticB) >= 0.45;
}

/**
 * Nombre “de producto” sin tallas/gramos (200 a 250g, 6-8 cm) para ver si es el mismo.
 * Ej. «AGUACATE EXTRA (200 a 260g)» ≈ «AGUACATE EXTRA (200 a 250g)».
 */
export function coreProductNameForMatch(value: string): string {
  return normalizeForMatch(value)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:a|al|a|-|–|—)\s*\d+(?:[.,]\d+)?\s*(?:g|kg|cm|mm|pza|pz)?\b/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:g|kg|cm|mm|pza|pz|kilos?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Decide si una sugerencia fuzzy se puede auto-asignar (sin pedir “Usar esta”).
 */
export function shouldAutoAcceptProductoSuggestion(params: {
  query: string;
  sugerenciaNombre: string;
  sugerenciaCodigo: string;
  topScore: number;
  secondScore: number | null;
  ambiguous: boolean;
}): boolean {
  const q = normalizeForMatch(params.query);
  const n = normalizeForMatch(params.sugerenciaNombre);
  const c = normalizeForMatch(params.sugerenciaCodigo);
  if (!q) return false;
  // Nombre o código exacto (normalizado) → asignar; no pedir «Usar esta».
  if (q === n || q === c) return true;
  if (c && (q.includes(c) || q.endsWith(c))) return true;

  // Mismo producto aunque cambien gramos/talla en el texto (260g vs 250g).
  const coreQ = coreProductNameForMatch(params.query);
  const coreN = coreProductNameForMatch(params.sugerenciaNombre);
  if (coreQ.length >= 4 && coreQ === coreN) {
    // «chile jalapeño» genérico vs dos tallas: no auto si quedó ambiguo y sin talla en el query.
    const queryTraeTalla = /\d/.test(params.query);
    if (!params.ambiguous || queryTraeTalla) return true;
    if (
      params.secondScore != null &&
      params.topScore - params.secondScore >= 0.08
    ) {
      return true;
    }
  }

  if (n.includes(q) && q.length >= 4 && params.topScore >= 0.75) {
    // Query contenido en el nombre del catálogo (ej. «PIÑA» ⊂ «PIÑA …»).
    if (params.secondScore == null || params.topScore - params.secondScore >= 0.08) {
      return true;
    }
  }
  if (productNamesLooselyMatch(params.query, params.sugerenciaNombre)) {
    // Nombre del cliente ≈ nombre catálogo: auto si no hay rival muy cerca.
    if (params.secondScore == null) return true;
    if (params.topScore - params.secondScore >= 0.08) return true;
    if (params.topScore >= 0.7 && params.secondScore < 0.55) return true;
  }
  if (params.topScore >= 0.7 && !params.ambiguous) return true;
  if (
    params.topScore >= 0.85 &&
    (params.secondScore == null || params.topScore - params.secondScore >= 0.12)
  ) {
    return true;
  }
  return false;
}

/**
 * Rankea el catálogo contra un texto del cliente / clave de Mateo.
 */
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
    const score = scoreProductoMatch(query, producto);
    if (score >= minScore) {
      scored.push({ producto, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.producto.nombre.localeCompare(b.producto.nombre, "es");
  });

  const candidates = scored.slice(0, limit);
  const best = candidates[0]?.producto ?? null;
  const second = candidates[1];
  const ambiguous = Boolean(
    candidates[0] &&
      second &&
      candidates[0].score - second.score < AMBIGUITY_GAP &&
      second.score >= minScore,
  );

  return { best, candidates, ambiguous };
}

/**
 * Producto del catálogo más cercano al texto del cliente.
 * null si el catálogo está vacío, la similitud es baja, o hay empate ambiguo
 * (en ese caso usa `rankProductosCatalogo` para ver alternativas).
 */
export function findClosestProductoCatalogo(
  query: string,
  productos: readonly ProductoVentaOption[],
): ProductoVentaOption | null {
  const result = rankProductosCatalogo(query, productos);
  if (!result.best) return null;
  // Si es ambiguo, igual devolvemos el mejor como sugerencia primaria;
  // el caller decide si mostrar alternativas.
  return result.best;
}

/**
 * Rivales por typo de 1 letra (jass↔hass) u homónimos de la misma familia.
 * Aunque el score del elegido sea 1.0 (match exacto del typo del cliente),
 * si otro producto solo difiere en una letra hay que pedir confirmación.
 */
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

    // Solo typo real (jass↔hass). NO tratar variantes de la misma familia
    // (extra/mediano, blanca/morada) como rivales: si ya hay match, se asigna.
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
