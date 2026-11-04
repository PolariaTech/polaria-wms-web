export type AliasPrecioComprador = {
  idProducto: string;
  precioOverride?: number | null;
  alias?: string | null;
};

/** REQ-135: el alias con precio gana; si no, queda el último precio de ese cliente. */
export function preciosYEquivalenciasDeComprador(
  aliases: readonly AliasPrecioComprador[],
  ultimos: Record<string, number>,
): {
  overrides: Record<string, number>;
  equivalencias: Record<string, string>;
} {
  const overrides: Record<string, number> = { ...ultimos };
  const equivalencias: Record<string, string> = {};
  for (const alias of aliases) {
    if (alias.precioOverride != null) {
      overrides[alias.idProducto] = alias.precioOverride;
    }
    const nombreAlias = alias.alias?.trim();
    if (nombreAlias) equivalencias[alias.idProducto] = nombreAlias;
  }
  return { overrides, equivalencias };
}
