import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getMe, login, logout } from "@/modules/auth";
import { notifyAuthChanged } from "@/lib/auth-broadcast";
import {
  AUTH_STORAGE_KEY,
  authPersistStorage,
  ensureAuthOnlyInLocalStorage,
  removeAuthFromLocalStorage,
} from "@/lib/auth-storage";
import { setAccessTokenGetter } from "@/services/api";
import type {
  AuthContext,
  AuthFlow,
  AuthSession,
  AuthTokens,
  LoginRequest,
  UserPreview,
} from "@/types/auth";

export { AUTH_STORAGE_KEY }; 

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  context: AuthContext | null;
  session: AuthSession | null;
  isHydrated: boolean;
  isLoading: boolean;
  setTokens: (tokens: AuthTokens, context: AuthContext) => void;
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
          context,
        });
        ensureAuthOnlyInLocalStorage();
        notifyAuthChanged();
      },

      setSession: (session) =>
        set({
          session,
          context: { scope: session.scope },
        }),

      clearAuth: () => {
        set({
          accessToken: null,
          refreshToken: null,
          context: null,
          session: null,
        });

        ensureAuthOnlyInLocalStorage();
        notifyAuthChanged();
      },

      clearAuthSilently: () => {
        set({
          accessToken: null,
          refreshToken: null,
          context: null,
          session: null,
        });
        ensureAuthOnlyInLocalStorage();
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
      }),
      onRehydrateStorage: () => (state) => {
        ensureAuthOnlyInLocalStorage();
        state?.setHydrated(true);
      },
    },
  ),
);

setAccessTokenGetter(() => useAuthStore.getState().accessToken);

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
