import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { expandTokenForms, tokenList } from "./producto-catalogo-tokens";
import { SYNONYM_INDEX } from "./producto-catalogo-synonyms";

export function productosFamiliasSinonimoConflictivas(
  textoCliente: string | null | undefined,
  producto: ProductoVentaOption | { nombre?: string | null; codigo?: string | null },
): boolean {
  const qTokens = tokenList(textoCliente ?? "");
  const pTokens = tokenList(
    `${producto.nombre ?? ""} ${producto.codigo ?? ""}`,
  );
  if (qTokens.length === 0 || pTokens.length === 0) return false;

  const groupsFor = (tokens: string[]): Set<ReadonlySet<string>> => {
    const out = new Set<ReadonlySet<string>>();
    for (const token of tokens) {
      for (const form of expandTokenForms(token)) {
        const group = SYNONYM_INDEX.get(form);
        if (group) out.add(group);
      }
    }
    return out;
  };

  const qGroups = groupsFor(qTokens);
  const pGroups = groupsFor(pTokens);
  if (qGroups.size === 0 || pGroups.size === 0) return false;
  for (const qg of qGroups) {
    if (pGroups.has(qg)) return false;
  }
  return true;
}