import { normalizeForMatch } from "./normalize-for-match";
import { tokenList } from "./producto-catalogo-tokens";

const UNIDAD_MEDIDA_TOKENS = new Set([
  "litro",
  "litros",
  "lt",
  "lts",
  "l",
  "ml",
  "mililitro",
  "mililitros",
  "kg",
  "kgs",
  "kilo",
  "kilos",
  "g",
  "gr",
  "gramos",
  "cm",
  "mm",
  "m",
  "oz",
  "lb",
  "lbs",
]);

export function codigoCoincideEnQuery(
  query: string,
  codigo: string | null | undefined,
): boolean {
  const q = normalizeForMatch(query);
  const c = normalizeForMatch(codigo ?? "");
  if (!q || !c) return false;
  if (q === c) return true;

  if (new RegExp(`\\(${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`).test(q)) {
    return true;
  }

  const tokens = tokenList(q);
  const shortOrNumeric = c.length < 4 || /^\d{1,5}$/.test(c);

  if (shortOrNumeric) {
    if (/\b(codigo|cod|sku|clave)\b/.test(q) && tokens.includes(c)) {
      const idx = tokens.indexOf(c);
      const prev = idx > 0 ? tokens[idx - 1]! : "";
      const next = idx < tokens.length - 1 ? tokens[idx + 1]! : "";
      if (UNIDAD_MEDIDA_TOKENS.has(next) || UNIDAD_MEDIDA_TOKENS.has(prev)) {
        return false;
      }
      return true;
    }
    return false;
  }

  if (tokens.includes(c)) return true;

  const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i");
  if (re.test(q)) return true;

  if (q.length >= 4 && (c.includes(q) || c.startsWith(q))) return true;

  return false;
}