import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/api/api";
import type { AuthSession } from "@/types/auth/auth";

const { mockUpdateMe, mockChangePassword, mockSetSession } = vi.hoisted(() => ({
  mockUpdateMe: vi.fn(),
  mockChangePassword: vi.fn(),
  mockSetSession: vi.fn(),
}));

const session: AuthSession = {
  idUsuario: "usr-1",
  idAuth: "auth-1",
  nombre: "Ana Pérez",
  username: "ana.perez",
  correo: "ana@empresa.com",
  telefono: "+573001112233",
  idRol: "administrador_cuenta",
  nombreRol: "Administrador de cuenta",
  nivelRol: "cuenta",
  codigoEmpresa: "EMP001",
  razonSocialEmpresa: "Empresa Demo SA",
  codigoCuenta: "CTA001",
  nombreComercialCuenta: "Cuenta Norte",
  idBodegas: [],
  scope: "tenant",
  schemaName: "emp_demo",
};

vi.mock("@/modules/auth", () => ({
  updateMe: (...args: unknown[]) => mockUpdateMe(...args),
  changePassword: (...args: unknown[]) => mockChangePassword(...args),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (
    selector: (state: {
      session: AuthSession;
      setSession: (next: AuthSession) => void;
    }) => unknown,
  ) =>
    selector({
      session,
      setSession: mockSetSession,
    }),
}));

import { PerfilPageContent } from "./PerfilPageContent";

describe("PerfilPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMe.mockResolvedValue({ ...session, nombre: "Ana María Pérez" });
    mockChangePassword.mockResolvedValue(undefined);
  });

  it("muestra correo y datos de cuenta de solo lectura", () => {
    render(<PerfilPageContent />);

    expect(screen.getByText("ana@empresa.com")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /correo/i })).toBeNull();
    expect(screen.getByText("ana.perez")).toBeInTheDocument();
    expect(screen.getAllByText("Administrador de cuenta").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Empresa Demo SA")).toBeInTheDocument();
    expect(screen.getByText("Cuenta Norte")).toBeInTheDocument();
  });

  it("guarda el nombre editado", async () => {
    const user = userEvent.setup();
    render(<PerfilPageContent />);

    const nombre = screen.getByLabelText(/^Nombre/);
    await user.clear(nombre);
    await user.type(nombre, "Ana María Pérez");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(mockUpdateMe).toHaveBeenCalledWith({
        nombre: "Ana María Pérez",
        telefono: "+573001112233",
      });
    });
    expect(mockSetSession).toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Datos del perfil actualizados.",
    );
  });

  it("cambia la contraseña cuando coincide la confirmación", async () => {
    const user = userEvent.setup();
    render(<PerfilPageContent />);

    await user.type(
      screen.getByLabelText(/^Contraseña actual/),
      "ClaveActual1!",
    );
    await user.type(screen.getByLabelText(/^Nueva contraseña/), "ClaveNueva1!");
    await user.type(
      screen.getByLabelText(/^Confirmar nueva contraseña/),
      "ClaveNueva1!",
    );
    await user.click(
      screen.getByRole("button", { name: "Actualizar contraseña" }),
    );

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: "ClaveActual1!",
        newPassword: "ClaveNueva1!",
      });
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Contraseña actualizada.",
    );
  });

  it("muestra error si la contraseña actual es incorrecta", async () => {
    const user = userEvent.setup();
    mockChangePassword.mockRejectedValue(
      new ApiError("Credenciales inválidas", 401),
    );
    render(<PerfilPageContent />);

    await user.type(screen.getByLabelText(/^Contraseña actual/), "ClaveMala1!");
    await user.type(screen.getByLabelText(/^Nueva contraseña/), "ClaveNueva1!");
    await user.type(
      screen.getByLabelText(/^Confirmar nueva contraseña/),
      "ClaveNueva1!",
    );
    await user.click(
      screen.getByRole("button", { name: "Actualizar contraseña" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "La contraseña actual no es correcta.",
      );
    });
  });
});
