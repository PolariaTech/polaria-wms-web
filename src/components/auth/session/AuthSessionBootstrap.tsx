"use client";

import { useCallback, useEffect, useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getPostLoginRoute, ROUTES } from "@/config/routes";
import { subscribeAuthChanged } from "@/lib/auth/auth-broadcast";
import { isProtectedPath } from "@/lib/auth/auth-routes";
import {
  expireAuthSession,
  getPersistedAccessToken,
  getPersistedSessionStartedAt,
  revalidateAuthSession,
  syncAuthWithPersistedStorage,
} from "@/lib/auth/auth-sync";
import { getSessionRemainingMs } from "@/lib/auth/auth-session-timeout";
import { isMateoSsoExitInProgress } from "@/lib/auth/mateo-sso-exit";
import { AUTH_STORAGE_KEY } from "@/lib/auth/auth-storage";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Mantiene una única sesión coherente entre pestañas:
 * - Sin token en localStorage → saca de rutas protegidas.
 * - Con token en otra pestaña → saca de /login.
 * - A las 12 h del login cierra Polaria (y con ello Mateo Support).
 */
export function AuthSessionBootstrap() {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const sessionStartedAt = useAuthStore((s) => s.sessionStartedAt);

  const enforceRouteAuth = useCallback(() => {
    if (isMateoSsoExitInProgress()) return;

    const remaining = getSessionRemainingMs(
      useAuthStore.getState().sessionStartedAt ??
        getPersistedSessionStartedAt(),
    );
    const token =
      useAuthStore.getState().accessToken ?? getPersistedAccessToken();

    if (token && remaining === 0) {
      void expireAuthSession().catch(() => undefined);
      if (isProtectedPath(pathname)) {
        router.replace(ROUTES.login);
      }
      return;
    }

    syncAuthWithPersistedStorage();
    const persistedToken = getPersistedAccessToken();

    if (isProtectedPath(pathname) && !persistedToken) {
      router.replace(ROUTES.login);
      return;
    }

    if (pathname === ROUTES.login && persistedToken) {
      if (useAuthStore.getState().isLoading) return;

      void revalidateAuthSession()
        .then(() => {
          const { accessToken: nextToken, session, context } =
            useAuthStore.getState();
          if (!nextToken) return;

          const scope = session?.scope ?? context?.scope;
          if (scope) {
            router.replace(getPostLoginRoute(scope));
          }
        })
        .catch(() => {
          // hydrateSession ya limpia sesión inválida; evitar overlay en dev.
        });
    }
  }, [pathname, router]);

  useLayoutEffect(() => {
    enforceRouteAuth();
  }, [enforceRouteAuth]);

  useEffect(() => {
    if (!accessToken) return;

    const remaining = getSessionRemainingMs(
      sessionStartedAt ?? getPersistedSessionStartedAt(),
    );
    const timeoutId = window.setTimeout(() => {
      void expireAuthSession().catch(() => undefined);
      router.replace(ROUTES.login);
    }, remaining);

    return () => window.clearTimeout(timeoutId);
  }, [accessToken, router, sessionStartedAt]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_STORAGE_KEY) return;
      enforceRouteAuth();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      // Solo alinea storage / logout; no revalida getMe (evita remount de la UI).
      enforceRouteAuth();
    };

    const unsubscribeBroadcast = subscribeAuthChanged(enforceRouteAuth);

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unsubscribeBroadcast();
    };
  }, [enforceRouteAuth]);

  return null;
}
