export function traducirErrorAlias(error: unknown): string | null {
  const mensaje = error instanceof Error ? error.message : String(error ?? "");
  if (!/duplicate key|unique constraint|uq_comprador_producto_alias/i.test(mensaje)) {
    return null;
  }
  if (/uq_comprador_producto_alias_frase/i.test(mensaje)) {
    return "Este comprador ya usa esa frase para otro producto.";
  }
  if (/uq_comprador_producto_alias_precio/i.test(mensaje)) {
    return "Este comprador ya tiene un precio especial para ese producto.";
  }
  return "Este comprador ya tiene una equivalencia para ese producto.";
}

export function aliasPrincipalPorPar<
  T extends {
    idComprador: string;
    idProducto: string;
    precioOverride?: number | null;
  },
>(aliases: readonly T[]): Map<string, T> {
  const principal = new Map<string, T>();
  for (const fila of aliases) {
    const clave = `${fila.idComprador}::${fila.idProducto}`;
    const actual = principal.get(clave);
    if (!actual) {
      principal.set(clave, fila);
      continue;
    }
    if (actual.precioOverride == null && fila.precioOverride != null) {
      principal.set(clave, fila);
    }
  }
  return principal;
}
