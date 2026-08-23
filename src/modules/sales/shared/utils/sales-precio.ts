import { parseCatalogoMetadatos } from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import { parseDecimalEs } from "@/lib/utils/decimal-es";

export interface PrecioProductoRow {
  id_producto: string;
  precio: string | number;
  fecha_aplicacion: string;
}

/** Precio unitario desde `producto.metadatos_catalogo.precio` (catálogo). */
export function resolvePrecioUnitarioFromMetadatos(value: unknown): number {
  const meta = parseCatalogoMetadatos(value);
  const parsed = parseDecimalEs(meta.precio ?? "");
  return parsed !== null && parsed >= 0 ? parsed : 0;
}

export function parsePrecioProducto(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/** Vigente = última `fecha_aplicacion` por producto. Asume filas más recientes primero. */
export function mapLatestPrecioProductoById(
  rows: PrecioProductoRow[],
): Map<string, number> {
  const precios = new Map<string, number>();

  for (const row of rows) {
    const idProducto = row.id_producto?.trim();
    if (!idProducto || precios.has(idProducto)) continue;
    precios.set(idProducto, parsePrecioProducto(row.precio));
  }

  return precios;
}
