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

const platformSession: AuthSession = {
  idUsuario: "cfg-1",
  idAuth: "auth-cfg",
  nombre: "Configurador",
  username: "configurador",
  correo: "configurador@polaria.tech",
  idRol: "configurador",
  nombreRol: "Configurador",
  nivelRol: "platform",
  codigoEmpresa: null,
  razonSocialEmpresa: null,
  codigoCuenta: null,
  nombreComercialCuenta: null,
  idBodegas: [],
  scope: "platform",
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

  it("completa login platform y redirige a /configurador", async () => {
    const user = userEvent.setup();

    mockPrelogin.mockResolvedValue({
      flow: "platform",
      userPreview: {
        nombre: "Configurador",
        identificador: "configurador@polaria.tech",
        empresa: null,
      },
    });
    mockPerformLogin.mockResolvedValue(platformSession);

    render(<LoginFlow />);

    await user.type(
      screen.getByLabelText(/correo/i),
      "configurador@polaria.tech",
    );
    await user.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/contraseña/i), "secret123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockPerformLogin).toHaveBeenCalledWith({
        identificador: "configurador@polaria.tech",
        password: "secret123",
      });
    });

    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.configurator);
      expect(mockReplace).not.toHaveBeenCalledWith(ROUTES.platform);
    });
  });
});
