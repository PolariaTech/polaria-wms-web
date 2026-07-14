import { AUTH_STORAGE_KEY, useAuthStore } from "@/stores/auth.store";
import { subscribeAuthChanged } from "@/lib/auth/auth-broadcast";
import {
  ensureAuthOnlyInLocalStorage,
  readAuthStorageRaw,
} from "@/lib/auth/auth-storage";

type PersistedAuthSlice = {
  accessToken: string | null;
  refreshToken: string | null;
};

function readPersistedAuthSlice(): PersistedAuthSlice | null {
  try {
    const raw = readAuthStorageRaw();
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { state?: PersistedAuthSlice };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

export function getPersistedAccessToken(): string | null {
  return readPersistedAuthSlice()?.accessToken ?? null;
}

/** Memoria y localStorage deben coincidir para considerar la sesión activa. */
export function isActiveAuthSession(
  memoryToken: string | null,
  persistedToken: string | null = getPersistedAccessToken(),
): boolean {
  return Boolean(
    memoryToken && persistedToken && memoryToken === persistedToken,
  );
}

/**
 * Alinea el estado en memoria con localStorage.
 * Devuelve false si no hay token persistido (sesión cerrada).
 */
export function syncAuthWithPersistedStorage(): boolean {
  ensureAuthOnlyInLocalStorage();
  const storedToken = getPersistedAccessToken();
  const { accessToken } = useAuthStore.getState();

  if (!storedToken) {
    if (accessToken) {
      useAuthStore.getState().clearAuth();
    }
    return false;
  }

  if (storedToken !== accessToken) {
    void useAuthStore.persist.rehydrate();
  }

  return true;
}

let revalidateInFlight: Promise<void> | null = null;

/**
 * Al volver a la pestaña solo alineamos storage (logout en otra pestaña).
 * No llamamos getMe / hydrateSession: eso ponía isLoading y desmontaba la UI.
 */
function syncOnForeground(): void {
  ensureAuthOnlyInLocalStorage();
  syncAuthWithPersistedStorage();
}

/** Relee storage y valida el token contra el API cuando corresponde. */
export async function revalidateAuthSession(): Promise<void> {
  if (useAuthStore.getState().isLoading) {
    return;
  }

  if (revalidateInFlight) {
    return revalidateInFlight;
  }

  revalidateInFlight = (async () => {
    syncAuthWithPersistedStorage();
    await useAuthStore.getState().hydrateSession();
  })();

  try {
    await revalidateInFlight;
  } finally {
    revalidateInFlight = null;
  }
}

function scheduleRevalidateAuthSession(): void {
  void revalidateAuthSession().catch(() => {
    // hydrateSession limpia sesión inválida; evitar unhandledRejection en dev.
  });
}

export function installAuthSyncListeners(): () => void {
  const onPageShow = () => {
    syncOnForeground();
  };

  const onVisibilityChange = () => {
    if (document.visibilityState !== "visible") return;
    syncOnForeground();
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== AUTH_STORAGE_KEY) return;
    scheduleRevalidateAuthSession();
  };

  const unsubscribeBroadcast = subscribeAuthChanged(() => {
    ensureAuthOnlyInLocalStorage();
    scheduleRevalidateAuthSession();
  });

  window.addEventListener("pageshow", onPageShow);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("pageshow", onPageShow);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("storage", onStorage);
    unsubscribeBroadcast();
  };
}

export { AUTH_STORAGE_KEY };
