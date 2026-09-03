export function normalizeTableSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function collectSearchableText(value: unknown, depth = 0): string {
  if (value == null || depth > 4) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => collectSearchableText(item, depth + 1)).join(" ");
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => collectSearchableText(item, depth + 1))
      .join(" ");
  }
  return "";
}

export function filterRowsBySearch<T>(
  rows: readonly T[],
  query: string,
): T[] {
  const tokens = normalizeTableSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return rows as T[];

  return rows.filter((row) => {
    const haystack = normalizeTableSearch(collectSearchableText(row));
    return tokens.every((token) => haystack.includes(token));
  });
}
