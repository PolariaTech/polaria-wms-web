import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/api";

const { mockMateoHandoff, mockClearAuthSilently, mockLogoutWithToken } =
  vi.hoisted(() => ({
    mockMateoHandoff: vi.fn(),
    mockClearAuthSilently: vi.fn(),
    mockLogoutWithToken: vi.fn(),
  }));

vi.mock("@/components/auth/AuthGuard", () => ({
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/providers/CompanyProvider", () => ({
  TenantBodegaSelector: () => null,
}));

vi.mock("@/modules/auth", () => ({
  mateoHandoff: () => mockMateoHandoff(),
  logoutWithToken: (token: string) => mockLogoutWithToken(token),
}));

vi.mock("@/lib/mateo-sso-exit", () => ({
  markMateoSsoExit: vi.fn(),
}));

vi.mock("@/lib/auth-storage", () => ({
  removeAuthFromLocalStorage: vi.fn(),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: Object.assign(
    (
      selector: (state: {
        clearAuthSilently: () => void;
        session: { nombre: string; identificador: string; scope: string };
      }) => unknown,
    ) =>
      selector({
        clearAuthSilently: mockClearAuthSilently,
        session: {
          nombre: "Usuario Test",
          identificador: "test@polaria.tech",
          scope: "platform",
        },
      }),
    { getState: () => ({ accessToken: "test-token" }) },
  ),
}));

vi.mock("@/config/env", () => ({
  env: { mateoUrl: "https://mateo.example.com/" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

import { AppShellLayout } from "./AppShellLayout";

describe("AppShellLayout — Mateo IA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMateoHandoff.mockResolvedValue({ code: "sso-code-123" });
    mockLogoutWithToken.mockResolvedValue(undefined);

    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "" },
    });
  });

  it("invoca mateoHandoff, limpia sesión y navega al SSO de Mateo", async () => {
    const user = userEvent.setup();

    render(
      <AppShellLayout>
        <div>contenido</div>
      </AppShellLayout>,
    );

    await user.click(screen.getByRole("button", { name: "Abrir Mateo IA" }));

    await waitFor(() => {
      expect(mockMateoHandoff).toHaveBeenCalledOnce();
      expect(mockClearAuthSilently).toHaveBeenCalledOnce();
      expect(mockLogoutWithToken).toHaveBeenCalledWith("test-token");
    });

    expect(window.location.href).toBe(
      "https://mateo.example.com/auth/sso?code=sso-code-123",
    );
  });

  it("no limpia sesión ni redirige si mateoHandoff falla", async () => {
    const user = userEvent.setup();
    mockMateoHandoff.mockRejectedValue(
      new ApiError("mateo-handoff no disponible", 404),
    );

    render(
      <AppShellLayout>
        <div>contenido</div>
      </AppShellLayout>,
    );

    await user.click(screen.getByRole("button", { name: "Abrir Mateo IA" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(mockClearAuthSilently).not.toHaveBeenCalled();
    expect(mockLogoutWithToken).not.toHaveBeenCalled();
    expect(window.location.href).toBe("");
    expect(
      screen.getByRole("button", { name: "Abrir Mateo IA" }),
    ).not.toBeDisabled();
  });
});
