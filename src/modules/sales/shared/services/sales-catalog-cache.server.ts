type CacheEntry<T> = {
  expiresAt: number;
  body: T;
};

const TTL_MS = 2 * 60 * 1000;
const MAX_ENTRIES = 40;

const catalogCache = new Map<string, CacheEntry<unknown>>();
const tenantCache = new Map<string, CacheEntry<string | null>>();

function readCache<T>(
  store: Map<string, CacheEntry<unknown>>,
  key: string,
): T | null {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return null;
  }
  store.delete(key);
  store.set(key, hit as CacheEntry<unknown>);
  return hit.body;
}

function writeCache<T>(
  store: Map<string, CacheEntry<unknown>>,
  key: string,
  body: T,
): void {
  store.set(key, { body, expiresAt: Date.now() + TTL_MS });
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest == null) break;
    store.delete(oldest);
  }
}

export function getProductosVentaCatalogoCache(
  codigoCuenta: string,
): unknown | null {
  return readCache(catalogCache, codigoCuenta.trim());
}

export function setProductosVentaCatalogoCache(
  codigoCuenta: string,
  body: unknown,
): void {
  writeCache(catalogCache, codigoCuenta.trim(), body);
}

export function getTenantSchemaCache(codigoCuenta: string): string | null | undefined {
  const key = codigoCuenta.trim();
  if (!key) return null;
  const hit = tenantCache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    tenantCache.delete(key);
    return undefined;
  }
  return hit.body;
}

export function setTenantSchemaCache(
  codigoCuenta: string,
  schemaName: string | null,
): void {
  const key = codigoCuenta.trim();
  if (!key) return;
  tenantCache.set(key, { body: schemaName, expiresAt: Date.now() + TTL_MS });
  while (tenantCache.size > MAX_ENTRIES) {
    const oldest = tenantCache.keys().next().value;
    if (oldest == null) break;
    tenantCache.delete(oldest);
  }
}

/** Solo tests. */
export function clearSalesCatalogCaches(): void {
  catalogCache.clear();
  tenantCache.clear();
}
