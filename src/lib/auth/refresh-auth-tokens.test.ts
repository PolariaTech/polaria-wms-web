import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRefreshSession = vi.fn();
const mockGetSession = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      getSession: mockGetSession,
      refreshSession: mockRefreshSession,
    },
  }),
  syncSupabaseAuthSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/config/env", () => ({
  env: {
    supabaseUrl: "https://example.supabase.co",
    supabaseAnonKey: "anon-key",
  },
}));

import { refreshAuthTokens } from "@/lib/auth/refresh-auth-tokens";
import { useAuthStore } from "@/stores/auth.store";

describe("refreshAuthTokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: "access-old",
      refreshToken: "refresh-old",
      sessionStartedAt: Date.now(),
      context: null,
      session: null,
      isHydrated: true,
      isLoading: false,
    });
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "access-old",
          refresh_token: "refresh-old",
        },
      },
    });
  });

  it("actualiza el store con los tokens renovados", async () => {
    mockRefreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: "access-new",
          refresh_token: "refresh-new",
        },
      },
      error: null,
    });

    const started = useAuthStore.getState().sessionStartedAt;
    await expect(refreshAuthTokens()).resolves.toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("access-new");
    expect(useAuthStore.getState().refreshToken).toBe("refresh-new");
    expect(useAuthStore.getState().sessionStartedAt).toBe(started);
  });

  it("devuelve false si Supabase no renueva la sesión", async () => {
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid Refresh Token" },
    });

    await expect(refreshAuthTokens()).resolves.toBe(false);
    expect(useAuthStore.getState().accessToken).toBe("access-old");
  });
});
