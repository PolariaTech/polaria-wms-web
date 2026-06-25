import { beforeEach, describe, expect, it, vi } from "vitest";
import { logout } from "@/modules/auth";
import { getPersistedAccessToken } from "@/lib/auth-sync";

vi.mock("@/modules/auth", () => ({
  logout: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  setAccessTokenGetter: vi.fn(),
}));

import { useAuthStore } from "@/stores/auth.store";

describe("useAuthStore.performLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: "token-abc",
      refreshToken: "refresh-xyz",
      context: { scope: "platform" },
      session: null,
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
    expect(getPersistedAccessToken()).toBeNull();
  });
});
