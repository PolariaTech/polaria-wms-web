import { beforeEach, describe, expect, it } from "vitest";
import { AUTH_STORAGE_KEY } from "@/lib/auth/auth-storage";
import { useAuthStore } from "@/stores/auth.store";
import {
  getPersistedAccessToken,
  isActiveAuthSession,
  syncAuthWithPersistedStorage,
} from "@/lib/auth/auth-sync";

function writePersistedToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      state: {
        accessToken: token,
        refreshToken: "refresh",
        context: { scope: "platform" },
      },
      version: 0,
    }),
  );
}

describe("auth-sync", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      context: null,
      session: null,
      isHydrated: true,
      isLoading: false,
    });
  });

  it("lee el access token persistido en localStorage", () => {
    writePersistedToken("stored-token");
    expect(getPersistedAccessToken()).toBe("stored-token");
  });

  it("limpia memoria si localStorage ya no tiene sesión", () => {
    useAuthStore.setState({ accessToken: "stale-memory-token" });
    localStorage.removeItem(AUTH_STORAGE_KEY);

    syncAuthWithPersistedStorage();

    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("rehidrata memoria cuando otra pestaña actualiza localStorage", async () => {
    writePersistedToken("tab-b-token");

    const result = syncAuthWithPersistedStorage();
    await useAuthStore.persist.rehydrate();

    expect(result).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("tab-b-token");
  });

  it("rechaza sesión si memoria y localStorage no coinciden", () => {
    useAuthStore.setState({ accessToken: "memory-only" });
    writePersistedToken("storage-only");

    expect(isActiveAuthSession("memory-only", "storage-only")).toBe(false);
    expect(isActiveAuthSession("same", "same")).toBe(true);
  });
});
