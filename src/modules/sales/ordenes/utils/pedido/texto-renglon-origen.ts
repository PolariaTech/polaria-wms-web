/**
 * REQ-323: lo que el renglón numerado trae entre paréntesis y el producto leído no
 * contiene se suma a la especificación («FRESAS (DOMO) (Domo de 1 kg)» → «Domo de 1kg»).
 */
import { normalizeForMatch } from "../match/normalize-for-match";
import { extractDomoEspecificacion } from "./especificacion-madurez-domo";

export const LINEA_NUMERADA = /^\s*\d+\s*[.)]\s+(.+?)\s*(?:\[|·|$)/;

function etiquetasDeRenglonesNumerados(
  textoFuente: string | null | undefined,
): string[] {
  const etiquetas: string[] = [];
  for (const line of (textoFuente ?? "").replace(/\r\n/g, "\n").split("\n")) {
    const numerada = line.match(LINEA_NUMERADA);
    if (numerada?.[1]) etiquetas.push(numerada[1].trim());
  }
  return etiquetas;
}

function gruposParentesis(etiqueta: string): string[] {
  return [...etiqueta.matchAll(/\(([^()]*)\)/g)]
    .map((grupo) => grupo[1]!.trim())
    .filter(Boolean);
}

export function parentesisDelRenglonDesdeTexto(
  textoFuente: string | null | undefined,
  producto: string | null | undefined,
): string[] {
  const productoNorm = normalizeForMatch(producto ?? "");
  if (!productoNorm) return [];
  const coincidencias = etiquetasDeRenglonesNumerados(textoFuente).filter(
    (etiqueta) =>
      ` ${normalizeForMatch(etiqueta)} `.includes(` ${productoNorm} `),
  );
  if (coincidencias.length !== 1) return [];
  return gruposParentesis(coincidencias[0]!)
    .filter((grupo) => !productoNorm.includes(normalizeForMatch(grupo)))
    .map((grupo) => extractDomoEspecificacion(grupo) ?? grupo);
}

export function conParentesisDelRenglon(
  base: string | null,
  textoFuente: string | null | undefined,
  producto: string | null | undefined,
): string | null {
  const extras = parentesisDelRenglonDesdeTexto(textoFuente, producto);
  if (extras.length === 0) return base;
  const baseTexto = base?.trim() || "";
  const baseNorm = normalizeForMatch(baseTexto);
  const nuevos = extras.filter((extra) => {
    const extraNorm = normalizeForMatch(extra);
    return Boolean(extraNorm) && !baseNorm.includes(extraNorm);
  });
  if (nuevos.length === 0) return base;
  const prefijo = nuevos.join(" · ");
  return baseTexto ? `${prefijo} · ${baseTexto}` : prefijo;
}
