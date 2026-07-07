import { describe, expect, it } from "vitest";
import { AUTH_STORAGE_KEY } from "@/lib/auth/auth-storage";
import {
  AUTH_HASH_PREFIX,
  importAuthFromLocationHash,
  parsePolarAuthHash,
} from "@/lib/auth/auth-hash-import";

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

describe("auth-hash-import", () => {
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

    expect(parsed).toEqual(payload);
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
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe(JSON.stringify(payload));
    expect(window.location.hash).toBe("");
    expect(window.location.pathname).toBe("/dashboard");
  });
});
