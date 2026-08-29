import { AUTH_STORAGE_KEY, useAuthStore } from "@/stores/auth.store";
import { subscribeAuthChanged } from "@/lib/auth/auth-broadcast";
import {
  ensureAuthOnlyInLocalStorage,
  readAuthStorageRaw,
  removeAuthFromLocalStorage,
} from "@/lib/auth/auth-storage";
import { isMateoSsoExitInProgress } from "@/lib/auth/mateo-sso-exit";
import { isSessionExpired } from "@/lib/auth/auth-session-timeout";
import { logoutWithToken } from "@/modules/auth";

type PersistedAuthSlice = {
  accessToken: string | null;
  refreshToken: string | null;
  sessionStartedAt?: number | null;
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

export function getPersistedSessionStartedAt(): number | null {
  const started = readPersistedAuthSlice()?.sessionStartedAt;
  return typeof started === "number" ? started : null;
}

function resolveSessionStartedAt(): number | null {
  return (
    useAuthStore.getState().sessionStartedAt ?? getPersistedSessionStartedAt()
  );
}

/** Cierra la sesión local (store + localStorage) sin esperar al API. */
export function expireLocalAuth(): void {
  useAuthStore.getState().clearAuth();
  removeAuthFromLocalStorage();
}

/** Cierra sesión local de inmediato y revoca el token en el API. */
export async function expireAuthSession(): Promise<void> {
  if (isMateoSsoExitInProgress()) return;

  const token =
    useAuthStore.getState().accessToken ?? getPersistedAccessToken();
  expireLocalAuth();

  if (!token) return;
  try {
    await logoutWithToken(token);
  } catch {
    // La sesión local ya se cerró; el logout remoto no debe bloquear.
  }
}

function isCurrentSessionExpired(): boolean {
  const token =
    useAuthStore.getState().accessToken ?? getPersistedAccessToken();
  if (!token) return false;
  return isSessionExpired(resolveSessionStartedAt());
}

/** Memoria y localStorage deben coincidir, y no haber superado las 12 h. */
export function isActiveAuthSession(
  memoryToken: string | null,
  persistedToken: string | null = getPersistedAccessToken(),
): boolean {
  if (!memoryToken || !persistedToken || memoryToken !== persistedToken) {
    return false;
  }

  return !isSessionExpired(resolveSessionStartedAt());
}

/**
 * Alinea el estado en memoria con localStorage.
 * Devuelve false si no hay token persistido (sesión cerrada) o si expiró.
 */
export function syncAuthWithPersistedStorage(): boolean {
  ensureAuthOnlyInLocalStorage();

  if (isCurrentSessionExpired()) {
    void expireAuthSession().catch(() => undefined);
    return false;
  }

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
