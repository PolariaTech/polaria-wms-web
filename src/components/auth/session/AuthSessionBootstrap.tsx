"use client";

import { useCallback, useEffect, useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getPostLoginRoute, ROUTES } from "@/config/routes";
import { subscribeAuthChanged } from "@/lib/auth/auth-broadcast";
import { isProtectedPath } from "@/lib/auth/auth-routes";
import {
  getPersistedAccessToken,
  revalidateAuthSession,
  syncAuthWithPersistedStorage,
} from "@/lib/auth/auth-sync";
import { isMateoSsoExitInProgress } from "@/lib/auth/mateo-sso-exit";
import { AUTH_STORAGE_KEY } from "@/lib/auth/auth-storage";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Mantiene una única sesión coherente entre pestañas:
 * - Sin token en localStorage → saca de rutas protegidas.
 * - Con token en otra pestaña → saca de /login.
 */
export function AuthSessionBootstrap() {
  const pathname = usePathname();
  const router = useRouter();

  const enforceRouteAuth = useCallback(() => {
    if (isMateoSsoExitInProgress()) return;

    syncAuthWithPersistedStorage();
    const token = getPersistedAccessToken();

    if (isProtectedPath(pathname) && !token) {
      router.replace(ROUTES.login);
      return;
    }

    if (pathname === ROUTES.login && token) {
      if (useAuthStore.getState().isLoading) return;

      void revalidateAuthSession()
        .then(() => {
          const { accessToken, session, context } = useAuthStore.getState();
          if (!accessToken) return;

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
