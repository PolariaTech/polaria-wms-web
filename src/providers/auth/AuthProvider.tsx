"use client";

import { useEffect, useRef } from "react";
import {
  installAuthSyncListeners,
  revalidateAuthSession,
} from "@/lib/auth/auth-sync";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { env } from "@/config/env";
import { CompanyProvider } from "@/providers/tenant/CompanyProvider";
import { useAuthStore } from "@/stores/auth.store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hasInitialValidated = useRef(false);

  useEffect(() => installAuthSyncListeners(), []);

  useEffect(() => {
    if (!isHydrated || hasInitialValidated.current) return;
    hasInitialValidated.current = true;
    void revalidateAuthSession().catch(() => {});
  }, [isHydrated]);

  /** Propaga renovaciones automáticas de Supabase al store WMS (Nest Bearer). */
  useEffect(() => {
    if (!isHydrated || !env.supabaseUrl || !env.supabaseAnonKey) return;

    const supabase = createSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "TOKEN_REFRESHED" && event !== "SIGNED_IN") return;
      if (!session?.access_token || !session.refresh_token) return;

      const state = useAuthStore.getState();
      if (!state.accessToken) return;

      state.updateSessionTokens({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isHydrated]);

  return <CompanyProvider>{children}</CompanyProvider>;
}
