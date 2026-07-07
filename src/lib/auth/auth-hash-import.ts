import { AUTH_STORAGE_KEY } from "@/lib/auth/auth-storage";

export const AUTH_HASH_PREFIX = "#polaria-auth=";

export interface PolarAuthHashPayload {
  accessToken: string;
  refreshToken?: string | null;
  context?: { scope: "platform" | "tenant" } | null;
}

export interface ZustandAuthPersist {
  state: {
    accessToken: string;
    refreshToken: string | null;
    context: { scope: "platform" | "tenant" } | null;
  };
  version: number;
}

function decodeBase64Url(encoded: string): string {
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return atob(padded);
}

export function parsePolarAuthHash(hash: string): ZustandAuthPersist | null {
  if (!hash.startsWith(AUTH_HASH_PREFIX)) return null;

  const encoded = hash.slice(AUTH_HASH_PREFIX.length);
  if (!encoded) return null;

  try {
    const decoded = decodeBase64Url(encoded);
    const payload = JSON.parse(decoded) as
      | ZustandAuthPersist
      | PolarAuthHashPayload;

    if ("state" in payload && payload.state?.accessToken) {
      return {
        state: {
          accessToken: payload.state.accessToken,
          refreshToken: payload.state.refreshToken ?? null,
          context: payload.state.context ?? null,
        },
        version: payload.version ?? 0,
      };
    }

    const flat = payload as PolarAuthHashPayload;
    if (!flat.accessToken) return null;

    return {
      state: {
        accessToken: flat.accessToken,
        refreshToken: flat.refreshToken ?? null,
        context: flat.context ?? null,
      },
      version: 0,
    };
  } catch {
    return null;
  }
}

export function importAuthFromLocationHash(): boolean {
  if (typeof window === "undefined") return false;

  const stored = parsePolarAuthHash(window.location.hash);
  if (!stored) return false;

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));

  const cleanUrl = window.location.pathname + window.location.search;
  window.history.replaceState(null, "", cleanUrl);

  return true;
}
