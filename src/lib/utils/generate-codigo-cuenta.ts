const CODIGO_CUENTA_LENGTH = 5;

/** Genera un código de cuenta en base 36 (5 caracteres) a partir del nombre. */
export function generateCodigoCuentaFromNombre(nombre: string): string {
  const normalized = nombre.trim();
  if (!normalized) return "";

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 36 + normalized.charCodeAt(i)) >>> 0;
  }

  return hash
    .toString(36)
    .toUpperCase()
    .padStart(CODIGO_CUENTA_LENGTH, "0")
    .slice(-CODIGO_CUENTA_LENGTH);
}

export function normalizeCodigoCuentaInput(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 32);
}
