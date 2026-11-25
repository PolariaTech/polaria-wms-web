"use client";

import type { ProductoPrimarioOption } from "../services/productos-catalogo.service";

export function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function matchesSearch(haystack: string, query: string): boolean {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const normalizedHaystack = normalizeSearch(haystack);
  return tokens.every((token) => normalizedHaystack.includes(token));
}

export function buildPrimarioHaystack(row: ProductoPrimarioOption): string {
  return [
    row.titulo,
    row.codigo,
    row.sku,
    row.categoria,
    row.proveedor,
    row.label,
  ].join(" ");
}

export function uniqueSorted(values: string[]): { value: string; label: string }[] {
  return Array.from(new Set(values.filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((value) => ({ value, label: value }));
}
