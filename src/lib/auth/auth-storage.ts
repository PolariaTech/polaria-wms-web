/**
 * Única fuente de persistencia para la sesión WMS.
 * `polaria-auth` vive EXCLUSIVAMENTE en localStorage (nunca en sessionStorage).
 */

export const AUTH_STORAGE_KEY = "polaria-auth";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getLocalStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getSessionStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Elimina `polaria-auth` de sessionStorage si existiera (legacy). */
export function purgeAuthFromSessionStorage(): void {
  getSessionStorage()?.removeItem(AUTH_STORAGE_KEY);
}

/** Migra datos legacy de sessionStorage → localStorage (solo si local está vacío). */
export function migrateAuthFromSessionToLocal(): void {
  const local = getLocalStorage();
  const session = getSessionStorage();
  if (!local || !session) return;

  const inLocal = local.getItem(AUTH_STORAGE_KEY);
  const inSession = session.getItem(AUTH_STORAGE_KEY);

  if (!inLocal && inSession) {
    local.setItem(AUTH_STORAGE_KEY, inSession);
  }
}

/** Garantiza que la sesión solo exista en localStorage. */
export function ensureAuthOnlyInLocalStorage(): void {
  migrateAuthFromSessionToLocal();
  purgeAuthFromSessionStorage();
}

/**
 * Adaptador para zustand/persist: lee y escribe solo en localStorage
 * y purga sessionStorage en cada operación.
 */
export const authPersistStorage: StorageLike = {
  getItem(name: string): string | null {
    ensureAuthOnlyInLocalStorage();
    return getLocalStorage()?.getItem(name) ?? null;
  },
  setItem(name: string, value: string): void {
    getLocalStorage()?.setItem(name, value);
    purgeAuthFromSessionStorage();
  },
  removeItem(name: string): void {
    getLocalStorage()?.removeItem(name);
    purgeAuthFromSessionStorage();
  },
};

export function readAuthStorageRaw(): string | null {
  ensureAuthOnlyInLocalStorage();
  return getLocalStorage()?.getItem(AUTH_STORAGE_KEY) ?? null;
}

export function removeAuthFromLocalStorage(): void {
  authPersistStorage.removeItem(AUTH_STORAGE_KEY);
}

ensureAuthOnlyInLocalStorage();
