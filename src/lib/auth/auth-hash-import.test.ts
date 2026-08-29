import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_STORAGE_KEY } from "@/lib/auth/auth-storage";
import {
  AUTH_HASH_PREFIX,
  importAuthFromLocationHash,
  parsePolarAuthHash,
} from "@/lib/auth/auth-hash-import";

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const NOW = 1_725_000_000_000;

describe("auth-hash-import", () => {
  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parsea payload zustand completo", () => {
    const payload = {
      state: {
        accessToken: "access-from-mateo",
        refreshToken: "refresh-from-mateo",
        context: { scope: "tenant" as const },
      },
      version: 0,
    };

    const hash = `${AUTH_HASH_PREFIX}${toBase64Url(JSON.stringify(payload))}`;
    const parsed = parsePolarAuthHash(hash);

    expect(parsed).toEqual({
      ...payload,
      state: {
        ...payload.state,
        sessionStartedAt: NOW,
      },
    });
  });

  it("parsea payload plano con tokens", () => {
    const payload = {
      accessToken: "flat-access",
      refreshToken: "flat-refresh",
      context: { scope: "platform" as const },
    };

    const hash = `${AUTH_HASH_PREFIX}${toBase64Url(JSON.stringify(payload))}`;
    const parsed = parsePolarAuthHash(hash);

    expect(parsed).toEqual({
      state: {
        accessToken: "flat-access",
        refreshToken: "flat-refresh",
        context: { scope: "platform" },
        sessionStartedAt: NOW,
      },
      version: 0,
    });
  });

  it("importa hash en localStorage y limpia la URL", () => {
    const payload = {
      state: {
        accessToken: "hash-token",
        refreshToken: "hash-refresh",
        context: { scope: "platform" as const },
      },
      version: 0,
    };

    const hash = `${AUTH_HASH_PREFIX}${toBase64Url(JSON.stringify(payload))}`;

    window.history.replaceState(null, "", `/dashboard${hash}`);

    const imported = importAuthFromLocationHash();

    expect(imported).toBe(true);
    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? "{}")).toEqual({
      ...payload,
      state: {
        ...payload.state,
        sessionStartedAt: NOW,
      },
    });
    expect(window.location.hash).toBe("");
    expect(window.location.pathname).toBe("/dashboard");
  });
});

