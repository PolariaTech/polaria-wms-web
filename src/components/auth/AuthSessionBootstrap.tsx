"use client";

import { useCallback, useEffect, useLayoutEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getPostLoginRoute, ROUTES } from "@/config/routes";
import { subscribeAuthChanged } from "@/lib/auth-broadcast";
import { isProtectedPath } from "@/lib/auth-routes";
import {
  getPersistedAccessToken,
  revalidateAuthSession,
  syncAuthWithPersistedStorage,
} from "@/lib/auth-sync";
import { isMateoSsoExitInProgress } from "@/lib/mateo-sso-exit";
import { AUTH_STORAGE_KEY } from "@/lib/auth-storage";
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
      void revalidateAuthSession().then(() => {
        const { accessToken, session, context } = useAuthStore.getState();
        if (!accessToken) return;

        const scope = session?.scope ?? context?.scope;
        if (scope) {
          router.replace(getPostLoginRoute(scope));
        }
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

    const unsubscribeBroadcast = subscribeAuthChanged(enforceRouteAuth);

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        enforceRouteAuth();
      }
    });

    return () => {
      window.removeEventListener("storage", onStorage);
      unsubscribeBroadcast();
    };
  }, [enforceRouteAuth]);

  return null;
}
