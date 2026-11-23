import type { ProductoVentaOption } from "../../../shared/types/sales.types";

export const PRESENTACION_SET = new Set([
  "",
  "Caja 1.5 kg",
  "Caja 20 kg",
  "Caja 21 kg",
  "Granel",
]);

export function catalogKey(nombre: string, codigo: string): string {
  return `${nombre} (${codigo})`;
}

export function norm(value: string | null | undefined): string {
  return (value ?? "").toString().trim().toLowerCase();
}

export function normalizeCatalogKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

/** Código entre paréntesis: "NOMBRE (SKU)" o texto con Cód. (115001005). */
export function extractCodigoFromCatalogKey(key: string): string | null {
  const trimmed = key.trim();
  const atEnd = trimmed.match(/\(([^()]+)\)\s*$/);
  if (atEnd?.[1]?.trim()) return atEnd[1].trim();
  // Cualquier (código alfanumérico) en el texto — típico en PDFs de cotización.
  const any = trimmed.match(/\(([A-Z0-9][A-Z0-9._-]{2,}|[0-9]{4,})\)/i);
  return any?.[1]?.trim() || null;
}

export function parsePrecioIa(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

/** SKU único en el mapa de códigos; si hay varios, no elige. */
export function productoUnicoPorCodigo(
  codigo: string | null | undefined,
  byCodigo: Map<string, ProductoVentaOption[]>,
): ProductoVentaOption | undefined {
  const key = norm(codigo ?? "");
  if (!key) return undefined;
  const hits = byCodigo.get(key) ?? [];
  return hits.length === 1 ? hits[0] : undefined;
}

export function buildProductoCatalogIndexes(productos: ProductoVentaOption[]) {
  const byKey = new Map(
    productos.map((p) => [catalogKey(p.nombre, p.codigo), p] as const),
  );
  const byKeyNorm = new Map(
    productos.map(
      (p) => [normalizeCatalogKey(catalogKey(p.nombre, p.codigo)), p] as const,
    ),
  );
  const byCodigo = new Map<string, ProductoVentaOption[]>();
  for (const p of productos) {
    const key = norm(p.codigo);
    if (!key) continue;
    const list = byCodigo.get(key) ?? [];
    list.push(p);
    byCodigo.set(key, list);
  }
  return { byKey, byKeyNorm, byCodigo };
}