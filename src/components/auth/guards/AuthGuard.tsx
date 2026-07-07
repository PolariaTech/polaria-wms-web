"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import {
  getPersistedAccessToken,
  isActiveAuthSession,
  syncAuthWithPersistedStorage,
} from "@/lib/auth/auth-sync";
import { isMateoSsoExitInProgress } from "@/lib/auth/mateo-sso-exit";
import { useAuthStore } from "@/stores/auth.store";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const persistedToken = getPersistedAccessToken();
  const sessionIsActive = isActiveAuthSession(accessToken, persistedToken);

  useEffect(() => {
    syncAuthWithPersistedStorage();
  }, []);

  useEffect(() => {
    if (isMateoSsoExitInProgress()) return;

    if (isHydrated && !isLoading && !sessionIsActive) {
      router.replace(ROUTES.login);
    }
  }, [isHydrated, isLoading, router, sessionIsActive]);

  if (!isHydrated || isLoading) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center bg-polaria-bg">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-polaria-teal border-t-transparent" />
        </div>
      )
    );
  }

  if (!sessionIsActive) {
    return null;
  }

  return <>{children}</>;
}
