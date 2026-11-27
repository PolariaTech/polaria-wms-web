export type AliasPrecioComprador = {
  idProducto: string;
  precioOverride?: number | null;
  alias?: string | null;
};

/**
 * REQ-135: en el catálogo el alias con precio gana; si no, queda el último precio.
 * REQ-366: además separa último y equivalencia para la línea que llegó sin precio.
 */
export function preciosYEquivalenciasDeComprador(
  aliases: readonly AliasPrecioComprador[],
  ultimos: Record<string, number>,
): {
  overrides: Record<string, number>;
  equivalencias: Record<string, string[]>;
  preciosUltimos: Record<string, number>;
  preciosEquivalencia: Record<string, number>;
} {
  const overrides: Record<string, number> = { ...ultimos };
  const preciosEquivalencia: Record<string, number> = {};
  const porProducto = new Map<
    string,
    { frases: string[]; fraseConPrecio: string | null }
  >();
  for (const alias of aliases) {
    if (alias.precioOverride != null) {
      overrides[alias.idProducto] = alias.precioOverride;
      preciosEquivalencia[alias.idProducto] = alias.precioOverride;
    }
    const nombreAlias = alias.alias?.trim();
    if (!nombreAlias) continue;
    const actual = porProducto.get(alias.idProducto) ?? {
      frases: [],
      fraseConPrecio: null,
    };
    actual.frases.push(nombreAlias);
    if (alias.precioOverride != null && actual.fraseConPrecio == null) {
      actual.fraseConPrecio = nombreAlias;
    }
    porProducto.set(alias.idProducto, actual);
  }
  const equivalencias: Record<string, string[]> = {};
  for (const [idProducto, grupo] of porProducto) {
    const unicas = [...new Set(grupo.frases)];
    unicas.sort((a, b) => a.localeCompare(b, "es"));
    const principal = grupo.fraseConPrecio;
    equivalencias[idProducto] = principal
      ? [principal, ...unicas.filter((frase) => frase !== principal)]
      : unicas;
  }
  return {
    overrides,
    equivalencias,
    preciosUltimos: { ...ultimos },
    preciosEquivalencia,
  };
}
