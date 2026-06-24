import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/api";

const {
  mockWmsSsoExchange,
  mockGetMe,
  mockSetTokens,
  mockSetSession,
  mockReplace,
  mockSearchParams,
} = vi.hoisted(() => ({
  mockWmsSsoExchange: vi.fn(),
  mockGetMe: vi.fn(),
  mockSetTokens: vi.fn(),
  mockSetSession: vi.fn(),
  mockReplace: vi.fn(),
  mockSearchParams: { get: vi.fn() },
}));

vi.mock("@/modules/auth", () => ({
  wmsSsoExchange: (code: string) => mockWmsSsoExchange(code),
  getMe: () => mockGetMe(),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: {
      setTokens: typeof mockSetTokens;
      setSession: typeof mockSetSession;
    }) => unknown,
  ) =>
    selector({
      setTokens: mockSetTokens,
      setSession: mockSetSession,
    }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

import { SsoFlow } from "./SsoFlow";

const mockSession = {
  idUsuario: "1",
  idAuth: "auth-1",
  nombre: "Administrador",
  username: "admin.acme",
  correo: "admin@acme.com",
  idRol: "admin",
  nombreRol: "Administrador",
  nivelRol: "empresa",
  codigoEmpresa: "ACME",
  razonSocialEmpresa: "ACME Corp",
  codigoCuenta: null,
  nombreComercialCuenta: null,
  idBodegas: ["BOD-01"],
  scope: "tenant" as const,
};

describe("SsoFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWmsSsoExchange.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: { scope: "tenant" },
    });
    mockGetMe.mockResolvedValue(mockSession);
  });

  it("canjea code válido, guarda sesión y redirige al dashboard", async () => {
    mockSearchParams.get.mockReturnValue("valid-code");

    render(<SsoFlow />);

    await waitFor(() => {
      expect(mockWmsSsoExchange).toHaveBeenCalledWith("valid-code");
      expect(mockSetTokens).toHaveBeenCalledWith(
        {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        },
        { scope: "tenant" },
      );
      expect(mockGetMe).toHaveBeenCalledOnce();
      expect(mockSetSession).toHaveBeenCalledWith(mockSession);
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("muestra error cuando el code es inválido", async () => {
    mockSearchParams.get.mockReturnValue("expired-code");
    mockWmsSsoExchange.mockRejectedValue(
      new ApiError("Credenciales inválidas", 401),
    );

    render(<SsoFlow />);

    expect(
      await screen.findByText(/código de acceso expiró o no es válido/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a iniciar sesión" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("muestra error amigable cuando falta el code", () => {
    mockSearchParams.get.mockReturnValue(null);

    render(<SsoFlow />);

    expect(screen.getByText(/enlace incompleto/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a iniciar sesión" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(mockWmsSsoExchange).not.toHaveBeenCalled();
  });
});
