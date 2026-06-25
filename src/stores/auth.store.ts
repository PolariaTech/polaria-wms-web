import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getMe, login, logout } from "@/modules/auth";
import { buildAuthContextFromSession } from "@/lib/auth-context";
import { notifyAuthChanged } from "@/lib/auth-broadcast";
import {
  AUTH_STORAGE_KEY,
  authPersistStorage,
  ensureAuthOnlyInLocalStorage,
  removeAuthFromLocalStorage,
} from "@/lib/auth-storage";
import { resolveActiveBodegaId } from "@/lib/active-bodega";
import { normalizeAuthSession, type AuthSessionApi } from "@/lib/normalize-nivel-rol";
import { syncSupabaseAuthSession } from "@/lib/supabase/client";
import { setTenantHeadersGetter } from "@/lib/tenant-headers";
import { setAccessTokenGetter } from "@/services/api";
import type {
  AuthContext,
  AuthContextInput,
  AuthFlow,
  AuthSession,
  AuthTokens,
  LoginRequest,
  UserPreview,
} from "@/types/auth";
import { createMinimalAuthContext } from "@/types/auth";
export { AUTH_STORAGE_KEY }; 

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  context: AuthContext | null;
  session: AuthSession | null;
  isHydrated: boolean;
  isLoading: boolean;
  setTokens: (tokens: AuthTokens, context: AuthContextInput) => void;
  setSession: (session: AuthSession) => void;
  clearAuth: () => void;
  /** Limpia sesión sin notificar (evita router.replace a /login durante SSO a Mateo). */
  clearAuthSilently: () => void;
  setHydrated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  performLogin: (payload: LoginRequest) => Promise<AuthSession>;
  hydrateSession: () => Promise<AuthSession | null>;
  performLogout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      context: null,
      session: null,
      isHydrated: false,
      isLoading: false,

      setTokens: (tokens, context) => {
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          context: {
            ...createMinimalAuthContext(context.scope),
            ...context,
          },
        });
        ensureAuthOnlyInLocalStorage();
        notifyAuthChanged();
        void syncSupabaseAuthSession(
          tokens.accessToken,
          tokens.refreshToken,
        );
      },

      setSession: (session) => {
        const normalized = normalizeAuthSession(session as AuthSessionApi);
        set({
          session: normalized,
          context: buildAuthContextFromSession(normalized),
        });
      },
      clearAuth: () => {
        set({
          accessToken: null,
          refreshToken: null,
          context: null,
          session: null,
        });

        ensureAuthOnlyInLocalStorage();
        notifyAuthChanged();
        void syncSupabaseAuthSession(null, null);
      },

      clearAuthSilently: () => {
        set({
          accessToken: null,
          refreshToken: null,
          context: null,
          session: null,
        });
        ensureAuthOnlyInLocalStorage();
        void syncSupabaseAuthSession(null, null);
      },
      setHydrated: (value) => set({ isHydrated: value }),
      setLoading: (value) => set({ isLoading: value }),

      performLogin: async (payload) => {
        set({ isLoading: true });
        try {
          const response = await login(payload);
          get().setTokens(
            {
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
            },
            response.context,
          );
          const session = await getMe();
          get().setSession(session);
          return session;
        } finally {
          set({ isLoading: false });
        }
      },

      hydrateSession: async () => {
        ensureAuthOnlyInLocalStorage();
        const { accessToken } = get();
        if (!accessToken) {
          set({ isHydrated: true });
          return null;
        }

        set({ isLoading: true });
        try {
          const session = await getMe();
          get().setSession(session);
          return session;
        } catch {
          get().clearAuth();
          return null;
        } finally {
          set({ isLoading: false, isHydrated: true });
        }
      },

      performLogout: async () => {
        try {
          if (get().accessToken) {
            await logout();
          }
        } catch {
          // clear local session even if remote logout fails
        } finally {
          get().clearAuth();
          removeAuthFromLocalStorage();
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => authPersistStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        context: state.context,
        session: state.session,
      }),
      onRehydrateStorage: () => (state) => {
        ensureAuthOnlyInLocalStorage();
        state?.setHydrated(true);
        if (state?.accessToken) {
          void syncSupabaseAuthSession(
            state.accessToken,
            state.refreshToken,
          );
        }
      },
    },
  ),
);

setAccessTokenGetter(() => useAuthStore.getState().accessToken);

setTenantHeadersGetter(() => {
  const state = useAuthStore.getState();
  const source = state.session ?? state.context;
  if (!source || source.scope !== "tenant" || !source.codigoEmpresa) {
    return null;
  }

  const idBodegas = state.session?.idBodegas ?? state.context?.idBodegas ?? [];
  const activeBodegaId = resolveActiveBodegaId(
    idBodegas,
    state.session?.idUsuario,
    null,
  );

  return {
    codigoEmpresa: source.codigoEmpresa,
    ...(source.codigoCuenta ? { codigoCuenta: source.codigoCuenta } : {}),
    ...(activeBodegaId ? { idBodega: activeBodegaId } : {}),
  };
});

export type LoginStep = "user" | "password" | "success";

export interface LoginFlowState {
  step: LoginStep;
  identificador: string;
  codigoEmpresa: string;
  flow: AuthFlow | null;
  userPreview: UserPreview | null;
}

export const initialLoginFlowState: LoginFlowState = {
  step: "user",
  identificador: "",
  codigoEmpresa: "",
  flow: null,
  userPreview: null,
};
