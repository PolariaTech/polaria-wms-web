import { normalizeForMatch } from "./normalize-for-match";

const COLOR_RE =
  /\b(rojo|roja|rojos|rojas|verde|verdes|amarillo|amarilla|amarillos|amarillas)\b/;

function raizColor(token: string): string {
  if (token.startsWith("roj")) return "roj";
  if (token.startsWith("verd")) return "verd";
  if (token.startsWith("amarill")) return "amarill";
  return token;
}

/**
 * REQ-311: si el cliente pide un color y el top del catálogo lo trae,
 * auto-aceptar aunque la familia morrón haya quedado “ambigua”.
 */
export function colorClienteDesambiguaSugerencia(params: {
  query: string;
  sugerenciaNombre: string;
  topScore: number;
  secondScore: number | null;
}): boolean {
  const q = normalizeForMatch(params.query);
  const n = normalizeForMatch(params.sugerenciaNombre);
  const colorQuery = q.match(COLOR_RE)?.[1];
  if (!colorQuery || params.topScore < 0.55) return false;
  const raiz = raizColor(colorQuery);
  if (!n.includes(raiz)) return false;
  if (params.secondScore == null) return true;
  return params.topScore - params.secondScore >= 0.05;
}
