import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";

const {
  mockReplace,
  mockPathname,
  mockAuthState,
  mockGetPersistedAccessToken,
  mockSync,
} = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPathname: { current: "/despacho" },
  mockAuthState: {
    accessToken: null as string | null,
    sessionStartedAt: null as string | null,
    isLoading: false,
    session: null,
    context: null,
  },
  mockGetPersistedAccessToken: vi.fn((): string | null => null),
  mockSync: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname.current,
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: Object.assign(
    (selector: (state: typeof mockAuthState) => unknown) =>
      selector(mockAuthState),
    { getState: () => mockAuthState },
  ),
}));

vi.mock("@/lib/auth/auth-sync", () => ({
  expireAuthSession: vi.fn(async () => undefined),
  getPersistedAccessToken: () => mockGetPersistedAccessToken(),
  getPersistedSessionStartedAt: () => null,
  revalidateAuthSession: vi.fn(async () => undefined),
  syncAuthWithPersistedStorage: () => mockSync(),
}));

vi.mock("@/lib/auth/auth-session-timeout", () => ({
  getSessionRemainingMs: () => 1,
}));

vi.mock("@/lib/auth/mateo-sso-exit", () => ({
  isMateoSsoExitInProgress: () => false,
}));

vi.mock("@/lib/auth/auth-broadcast", () => ({
  subscribeAuthChanged: () => () => undefined,
}));

import { AuthSessionBootstrap } from "./AuthSessionBootstrap";

describe("AuthSessionBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.current = "/despacho";
    mockAuthState.accessToken = null;
    mockAuthState.sessionStartedAt = null;
    mockAuthState.isLoading = false;
    mockGetPersistedAccessToken.mockReturnValue(null);
  });

  it("no pide login en el despacho público", () => {
    render(<AuthSessionBootstrap />);

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockSync).not.toHaveBeenCalled();
  });

  it("manda al login una ruta protegida sin token", () => {
    mockPathname.current = ROUTES.dashboard;

    render(<AuthSessionBootstrap />);

    expect(mockReplace).toHaveBeenCalledWith(ROUTES.login);
  });
});
