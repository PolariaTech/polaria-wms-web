"use client";

import { CATALOGO_CATEGORIA_OPTIONS } from "../constants/catalogo-producto";
import type { ProductoPrimarioOption } from "../services/productos-catalogo.service";

export function mergeCategoriaOptions(fromCatalog: string[]) {
  const map = new Map<string, string>();
  for (const option of CATALOGO_CATEGORIA_OPTIONS) {
    map.set(option.value, option.label);
  }
  for (const categoria of fromCatalog) {
    const trimmed = categoria.trim();
    if (trimmed && trimmed !== "—") {
      map.set(trimmed, trimmed);
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => a[1].localeCompare(b[1], "es"))
    .map(([value, label]) => ({ value, label }));
}

export function formatPrimarioLabel(primario: ProductoPrimarioOption): string {
  if (primario.titulo) {
    return `${primario.titulo} (${primario.codigo})`;
  }
  return primario.codigo || primario.sku;
}
