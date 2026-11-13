export function normalizeForMatch(value: string): string {
  return value
    .trim()
    // Mojibake frecuente de ñ/Ñ en PDFs/correos del tercero (PI¥A → PIÑA).
    .replace(/¥/g, "ñ")
    .replace(/\uFFFD/g, "n")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\*/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
