export function normalizePickerSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function matchesPickerSearch(haystack: string, query: string): boolean {
  const tokens = normalizePickerSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const normalizedHaystack = normalizePickerSearch(haystack);
  return tokens.every((token) => normalizedHaystack.includes(token));
}
