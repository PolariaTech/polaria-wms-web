import { parseCatalogoMetadatos } from "@/modules/admin-panel/catalogo/constants/catalogo-producto";
import { parseDecimalEs } from "@/lib/utils/decimal-es";

/** Precio unitario desde `producto.metadatos_catalogo.precio` (catálogo). */
export function resolvePrecioUnitarioFromMetadatos(value: unknown): number {
  const meta = parseCatalogoMetadatos(value);
  const parsed = parseDecimalEs(meta.precio ?? "");
  return parsed !== null && parsed >= 0 ? parsed : 0;
}
