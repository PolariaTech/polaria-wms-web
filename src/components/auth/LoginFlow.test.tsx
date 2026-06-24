import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import type { AuthSession } from "@/types/auth";

const { mockPerformLogin, mockReplace, mockPrelogin } = vi.hoisted(() => ({
  mockPerformLogin: vi.fn(),
  mockReplace: vi.fn(),
  mockPrelogin: vi.fn(),
}));

vi.mock("@/modules/auth", () => ({
  prelogin: (payload: unknown) => mockPrelogin(payload),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: { performLogin: typeof mockPerformLogin }) => unknown,
  ) => selector({ performLogin: mockPerformLogin }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import { LoginFlow } from "./LoginFlow";

const tenantSession: AuthSession = {
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
  codigoCuenta: "CUENTA-01",
  nombreComercialCuenta: null,
  idBodegas: ["BOD-01"],
  scope: "tenant",
};

describe("LoginFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockPrelogin.mockResolvedValue({
      flow: "tenant",
      userPreview: {
        nombre: "Administrador",
        identificador: "admin@acme.com",
        empresa: { nombre: "ACME Corp", codigo: "ACME" },
      },
    });

    mockPerformLogin.mockResolvedValue(tenantSession);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("completa login tenant y redirige al dashboard", async () => {
    const user = userEvent.setup();

    render(<LoginFlow />);

    await user.type(screen.getByLabelText(/correo/i), "admin@acme.com");
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/contraseña/i), "secret123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockPerformLogin).toHaveBeenCalledWith({
        identificador: "admin@acme.com",
        password: "secret123",
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/¡Bienvenido/i)).toBeInTheDocument();
    });

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.dashboard);
    });
  });
});
