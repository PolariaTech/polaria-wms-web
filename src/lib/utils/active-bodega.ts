export const ACTIVE_BODEGA_STORAGE_KEY = "polaria-active-bodega";

export function readStoredBodegaId(userId: string | undefined): string | null {
  if (typeof window === "undefined" || !userId) return null;

  try {
    const raw = window.localStorage.getItem(ACTIVE_BODEGA_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[userId] ?? null;
  } catch {
    return null;
  }
}

export function writeStoredBodegaId(userId: string, bodegaId: string): void {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(ACTIVE_BODEGA_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    parsed[userId] = bodegaId;
    window.localStorage.setItem(
      ACTIVE_BODEGA_STORAGE_KEY,
      JSON.stringify(parsed),
    );
  } catch {
    // ignore quota / private mode
  }
}

export function resolveActiveBodegaId(
  idBodegas: string[],
  userId: string | undefined,
  preferredId: string | null,
): string | null {
  if (idBodegas.length === 0) return null;

  const stored = readStoredBodegaId(userId);
  const candidate = preferredId ?? stored ?? idBodegas[0] ?? null;

  if (candidate && idBodegas.includes(candidate)) {
    return candidate;
  }

  return idBodegas[0] ?? null;
}
