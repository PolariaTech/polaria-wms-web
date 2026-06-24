"use client";

import { useEffect, useRef } from "react";
import {
  installAuthSyncListeners,
  revalidateAuthSession,
} from "@/lib/auth-sync";
import { syncSupabaseAuthSession } from "@/lib/supabase/client";
import { CompanyProvider } from "@/providers/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const hasInitialValidated = useRef(false);

  useEffect(() => installAuthSyncListeners(), []);

  useEffect(() => {
    if (!isHydrated || hasInitialValidated.current) return;
    hasInitialValidated.current = true;
    void revalidateAuthSession();
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    void syncSupabaseAuthSession(accessToken, refreshToken);
  }, [accessToken, isHydrated, refreshToken]);

  return <CompanyProvider>{children}</CompanyProvider>;
}
