import { normalizeForMatch } from "./normalize-for-match";

/** Tokens demasiado genéricos para decidir entre variantes del mismo producto. */
export const STOP_TOKENS = new Set([
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
export const VARIANT_QUALIFIER_TOKENS = new Set([
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

const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ["arandano", "arandanos", "blueberry", "blueberries", "blueberrie"],
  ["frambuesa", "frambuesas", "raspberry", "raspberries"],
  ["fresa", "fresas", "strawberry", "strawberries"],
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
  ["chile", "chiles", "pepper", "peppers", "pimiento", "pimientos", "morron", "morrones"],
  ["guanabana", "soursop"],
  ["maracuya", "passionfruit", "passion"],
  ["orejona", "orejonas", "romana", "romanas", "romaine"],
];

export const SYNONYM_INDEX: Map<string, ReadonlySet<string>> = (() => {
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