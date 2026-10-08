import { isSessionExpired } from "@/lib/auth/auth-session-timeout";
import {
  createSupabaseBrowserClient,
  syncSupabaseAuthSession,
} from "@/lib/supabase/client";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/auth.store";

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Renueva el access token vía Supabase y lo escribe en el auth store
 * sin reiniciar el reloj de sesión WMS (tope 7 días).
 */
export async function refreshAuthTokens(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      if (!env.supabaseUrl || !env.supabaseAnonKey) return false;

      const state = useAuthStore.getState();
      if (!state.accessToken || !state.refreshToken) return false;

      if (isSessionExpired(state.sessionStartedAt)) {
        return false;
      }

      const supabase = createSupabaseBrowserClient();
      const { data: current } = await supabase.auth.getSession();

      if (
        !current.session ||
        current.session.access_token !== state.accessToken ||
        current.session.refresh_token !== state.refreshToken
      ) {
        await syncSupabaseAuthSession(state.accessToken, state.refreshToken);
      }

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) return false;

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session?.access_token || !data.session.refresh_token) {
        return false;
      }

      useAuthStore.getState().updateSessionTokens({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });

      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}
