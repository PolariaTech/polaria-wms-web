import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";

const { mockReplace, mockSyncAuth, mockGetPersistedToken, mockIsActiveSession } =
  vi.hoisted(() => ({
    mockReplace: vi.fn(),
    mockSyncAuth: vi.fn(),
    mockGetPersistedToken: vi.fn(),
    mockIsActiveSession: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("@/lib/auth/auth-sync", () => ({
  syncAuthWithPersistedStorage: () => mockSyncAuth(),
  getPersistedAccessToken: () => mockGetPersistedToken(),
  isActiveAuthSession: (
    memoryToken: string | null,
    persistedToken: string | null,
  ) => mockIsActiveSession(memoryToken, persistedToken),
}));

vi.mock("@/lib/auth/mateo-sso-exit", () => ({
  isMateoSsoExitInProgress: () => mockMateoExitInProgress,
}));

let mockMateoExitInProgress = false;

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: {
      accessToken: string | null;
      isHydrated: boolean;
      isLoading: boolean;
    }) => unknown,
  ) =>
    selector({
      accessToken: mockAuthState.accessToken,
      isHydrated: mockAuthState.isHydrated,
      isLoading: mockAuthState.isLoading,
    }),
}));

const mockAuthState = {
  accessToken: null as string | null,
  isHydrated: true,
  isLoading: false,
};

import { AuthGuard } from "./AuthGuard";

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMateoExitInProgress = false;
    mockAuthState.accessToken = null;
    mockAuthState.isHydrated = true;
    mockAuthState.isLoading = false;
    mockGetPersistedToken.mockReturnValue(null);
    mockIsActiveSession.mockReturnValue(false);
    mockSyncAuth.mockReturnValue(false);
  });

  it("muestra fallback mientras hidrata o carga", () => {
    mockAuthState.isHydrated = false;

    render(
      <AuthGuard fallback={<span>cargando sesión</span>}>
        <span>contenido protegido</span>
      </AuthGuard>,
    );

    expect(screen.getByText("cargando sesión")).toBeInTheDocument();
    expect(screen.queryByText("contenido protegido")).not.toBeInTheDocument();
  });

  it("redirige a login sin sesión activa", async () => {
    mockAuthState.accessToken = null;
    mockGetPersistedToken.mockReturnValue(null);
    mockIsActiveSession.mockReturnValue(false);

    render(
      <AuthGuard>
        <span>contenido protegido</span>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.login);
    });
    expect(screen.queryByText("contenido protegido")).not.toBeInTheDocument();
  });

  it("renderiza hijos con sesión activa", () => {
    mockAuthState.accessToken = "token-abc";
    mockGetPersistedToken.mockReturnValue("token-abc");
    mockIsActiveSession.mockReturnValue(true);

    render(
      <AuthGuard>
        <span>contenido protegido</span>
      </AuthGuard>,
    );

    expect(screen.getByText("contenido protegido")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("no redirige a login durante salida SSO hacia Mateo", async () => {
    mockMateoExitInProgress = true;
    mockAuthState.accessToken = null;
    mockIsActiveSession.mockReturnValue(false);

    render(
      <AuthGuard>
        <span>contenido protegido</span>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(mockSyncAuth).toHaveBeenCalled();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("sincroniza storage al montar", () => {
    mockAuthState.accessToken = "token-abc";
    mockIsActiveSession.mockReturnValue(true);

    render(
      <AuthGuard>
        <span>contenido protegido</span>
      </AuthGuard>,
    );

    expect(mockSyncAuth).toHaveBeenCalled();
  });
});
