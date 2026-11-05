/**
 * REQ-234 / REQ-165: no llevar a OT/form SKUs con cantidad 0 (Excel filtrado).
 * Los placeholders de OT (sin producto ni código) se conservan.
 */

export function parseCantidadOrigen(
  value: number | string | null | undefined,
): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function tieneIdentidadProductoOrigen(input: {
  producto?: string | null;
  codigoProducto?: string | null;
}): boolean {
  return Boolean(
    (input.producto ?? "").trim() || (input.codigoProducto ?? "").trim(),
  );
}

/** Renglón de origen_correo / OT: omitir si hay SKU y cantidad <= 0. */
export function esRenglonOrigenPedible(row: {
  Producto?: string | null;
  "Codigo producto"?: string | null;
  Cantidad?: number | string | null;
}): boolean {
  const tieneProducto = tieneIdentidadProductoOrigen({
    producto: row.Producto,
    codigoProducto: row["Codigo producto"],
  });
  if (!tieneProducto) return true;
  const cantidad = parseCantidadOrigen(row.Cantidad);
  if (cantidad == null) return true;
  return cantidad > 0;
}

/** Línea extraída por Mateo: misma regla. */
export function esLineaExtraidaPedible(linea: {
  textoOriginal?: string | null;
  productoCatalogo?: string | null;
  codigoProductoCliente?: string | null;
  cantidad?: number | null;
}): boolean {
  const tieneProducto = tieneIdentidadProductoOrigen({
    producto: linea.textoOriginal || linea.productoCatalogo,
    codigoProducto: linea.codigoProductoCliente,
  });
  if (!tieneProducto) return false;
  if (linea.cantidad == null) return true;
  return linea.cantidad > 0;
}

export function filtrarRenglonesOrigenPedibles<T extends {
  Producto?: string | null;
  "Codigo producto"?: string | null;
  Cantidad?: number | string | null;
}>(rows: readonly T[]): T[] {
  return rows.filter(esRenglonOrigenPedible);
}

export function filtrarLineasExtraidasPedibles<T extends {
  textoOriginal?: string | null;
  productoCatalogo?: string | null;
  codigoProductoCliente?: string | null;
  cantidad?: number | null;
}>(lineas: readonly T[]): T[] {
  return lineas.filter(esLineaExtraidaPedible);
}
