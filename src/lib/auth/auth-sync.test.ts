import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_STORAGE_KEY } from "@/lib/auth/auth-storage";
import { SESSION_MAX_AGE_MS } from "@/lib/auth/auth-session-timeout";
import { useAuthStore } from "@/stores/auth.store";
import {
  expireLocalAuth,
  getPersistedAccessToken,
  isActiveAuthSession,
  syncAuthWithPersistedStorage,
} from "@/lib/auth/auth-sync";

vi.mock("@/modules/auth", () => ({
  logoutWithToken: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  getMe: vi.fn(),
  login: vi.fn(),
}));

function writePersistedToken(
  token: string | null,
  sessionStartedAt: number | null = Date.now(),
) {
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
        sessionStartedAt,
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
      sessionStartedAt: null,
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
    useAuthStore.setState({
      accessToken: "memory-only",
      sessionStartedAt: Date.now(),
    });
    writePersistedToken("storage-only");

    expect(isActiveAuthSession("memory-only", "storage-only")).toBe(false);
    expect(isActiveAuthSession("same", "same")).toBe(true);
  });

  it("no considera activa una sesión de más de 12 horas", () => {
    const started = Date.now() - SESSION_MAX_AGE_MS - 1;
    useAuthStore.setState({
      accessToken: "same",
      sessionStartedAt: started,
    });
    writePersistedToken("same", started);

    expect(isActiveAuthSession("same", "same")).toBe(false);
  });

  it("cierra la sesión persistida si ya pasaron 12 horas", () => {
    const started = Date.now() - SESSION_MAX_AGE_MS - 1;
    useAuthStore.setState({
      accessToken: "expired-token",
      sessionStartedAt: started,
    });
    writePersistedToken("expired-token", started);

    const result = syncAuthWithPersistedStorage();

    expect(result).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(getPersistedAccessToken()).toBeNull();
  });

  it("expireLocalAuth limpia store y localStorage", () => {
    useAuthStore.setState({
      accessToken: "token",
      sessionStartedAt: Date.now(),
    });
    writePersistedToken("token");

    expireLocalAuth();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().sessionStartedAt).toBeNull();
    expect(getPersistedAccessToken()).toBeNull();
  });
});
