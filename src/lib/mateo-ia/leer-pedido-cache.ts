type CacheEntry = {
  expiresAt: number;
  body: unknown;
};

const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 40;
const cache = new Map<string, CacheEntry>();

export function buildLeerPedidoCacheKey(parts: {
  codigoCuenta: string;
  texto: string;
  archivos: readonly { nombre: string; size: number; base64Head: string }[];
}): string {
  const archivosKey = parts.archivos
    .map((a) => `${a.nombre}:${a.size}:${a.base64Head}`)
    .join("|");
  return `${parts.codigoCuenta}::${parts.texto.slice(0, 2000)}::${archivosKey}`;
}

export function getLeerPedidoCache(key: string): unknown | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  // LRU touch
  cache.delete(key);
  cache.set(key, hit);
  return hit.body;
}

export function setLeerPedidoCache(key: string, body: unknown): void {
  cache.set(key, { body, expiresAt: Date.now() + TTL_MS });
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest == null) break;
    cache.delete(oldest);
  }
}

/** Solo tests. */
export function clearLeerPedidoCache(): void {
  cache.clear();
}
