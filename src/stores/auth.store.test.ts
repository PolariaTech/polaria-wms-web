import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMe, logout } from "@/modules/auth";
import { getPersistedAccessToken } from "@/lib/auth/auth-sync";
import { SESSION_MAX_AGE_MS } from "@/lib/auth/auth-session-timeout";

vi.mock("@/modules/auth", () => ({
  logout: vi.fn(),
  logoutWithToken: vi.fn(),
  getMe: vi.fn(),
  login: vi.fn(),
}));

vi.mock("@/services/api/api", () => ({
  setAccessTokenGetter: vi.fn(),
}));

import { useAuthStore } from "@/stores/auth.store";

describe("useAuthStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: "token-abc",
      refreshToken: "refresh-xyz",
      context: {
        scope: "platform",
        codigoEmpresa: null,
        codigoCuenta: null,
        idBodegas: [],
        nivelRol: "platform",
        schemaName: null,
      },
      session: null,
      sessionStartedAt: Date.now(),
      isHydrated: true,
      isLoading: false,
    });
  });

  it("limpia la sesión local aunque falle POST /auth/logout", async () => {
    vi.mocked(logout).mockRejectedValue(new Error("network error"));

    await useAuthStore.getState().performLogout();

    expect(logout).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(useAuthStore.getState().context).toBeNull();
    expect(useAuthStore.getState().sessionStartedAt).toBeNull();
    expect(getPersistedAccessToken()).toBeNull();
  });

  it("marca el inicio de sesión al guardar tokens", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);

    useAuthStore.getState().setTokens(
      { accessToken: "new-access", refreshToken: "new-refresh" },
      { scope: "platform" },
    );

    expect(useAuthStore.getState().sessionStartedAt).toBe(now);
    vi.restoreAllMocks();
  });

  it("cierra la sesión al hidratar si pasaron 12 horas", async () => {
    useAuthStore.setState({
      sessionStartedAt: Date.now() - SESSION_MAX_AGE_MS - 1,
    });

    const result = await useAuthStore.getState().hydrateSession();

    expect(result).toBeNull();
    expect(getMe).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(getPersistedAccessToken()).toBeNull();
  });
});
