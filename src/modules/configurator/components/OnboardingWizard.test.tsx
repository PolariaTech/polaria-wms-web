import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WmsRol } from "@/constants/roles";
import { OnboardingWizard } from "./OnboardingWizard";

const createEmpresaConfigurator = vi.fn();
const createCuentaConfigurator = vi.fn();
const createBodegaInternaConfigurator = vi.fn();
const createUsuarioConfigurator = vi.fn();

vi.mock("../services/empresas.service", () => ({
  createEmpresaConfigurator: (...args: unknown[]) =>
    createEmpresaConfigurator(...args),
}));

vi.mock("../services/cuentas.service", () => ({
  createCuentaConfigurator: (...args: unknown[]) =>
    createCuentaConfigurator(...args),
}));

vi.mock("../services/bodegas-internas.service", () => ({
  createBodegaInternaConfigurator: (...args: unknown[]) =>
    createBodegaInternaConfigurator(...args),
}));

vi.mock("../services/usuarios.service", () => ({
  createUsuarioConfigurator: (...args: unknown[]) =>
    createUsuarioConfigurator(...args),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (state: { session: { idUsuario: string } }) => unknown) =>
    selector({ session: { idUsuario: "user-1" } }),
}));

describe("OnboardingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createEmpresaConfigurator.mockResolvedValue({
      codigoEmpresa: "MIT00",
      razonSocial: "Mitre S.A.",
      estaActiva: true,
    });
    createCuentaConfigurator.mockResolvedValue({
      codigoCuenta: "CUE01",
      nombreComercial: "Mitre Comercial",
      bodegaAsignada: "—",
      tieneCredenciales: false,
    });
    createBodegaInternaConfigurator.mockResolvedValue({
      idBodega: "bodega-uuid-1234",
      nombre: "Central",
      capacidad: 100,
      bodegaAsignada: "Mitre Comercial",
    });
    createUsuarioConfigurator.mockResolvedValue({
      idUsuario: "user-admin",
      codigo: "CUE01",
      rol: "Administrador de cuenta",
      nombre: "Ana Admin",
      cuenta: "Mitre Comercial",
      tieneCredenciales: true,
    });
  });

  it("renderiza el paso 1 con indicador de progreso", () => {
    render(<OnboardingWizard />);

    expect(
      screen.getByRole("heading", { name: "Onboarding nuevo tenant", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Paso 1: Empresa")).toBeInTheDocument();
    expect(screen.getByLabelText("Razón social")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Atrás" })).toBeDisabled();
  });

  it("avanza al paso 2 tras crear la empresa", async () => {
    const user = userEvent.setup();

    render(<OnboardingWizard />);

    await user.type(screen.getByLabelText("Razón social"), "Mitre S.A.");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(createEmpresaConfigurator).toHaveBeenCalledWith({
        razonSocial: "Mitre S.A.",
        codigoEmpresa: expect.any(String),
        idCreador: "user-1",
      });
    });

    expect(screen.getByText("Paso 2: Cuenta")).toBeInTheDocument();
    expect(screen.getByLabelText("Empresa")).toHaveValue("Mitre S.A. (MIT00)");
  });

  it("permite volver atrás sin perder datos del paso 1", async () => {
    const user = userEvent.setup();

    render(<OnboardingWizard />);

    await user.type(screen.getByLabelText("Razón social"), "Mitre S.A.");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await screen.findByText("Paso 2: Cuenta");

    await user.click(screen.getByRole("button", { name: "Atrás" }));

    expect(screen.getByText("Paso 1: Empresa")).toBeInTheDocument();
    expect(screen.getByLabelText("Razón social")).toHaveValue("Mitre S.A.");
    expect(createEmpresaConfigurator).toHaveBeenCalledTimes(1);
  });

  it("crea admin de cuenta vía createUsuarioConfigurator (POST /configurador/usuarios)", async () => {
    const user = userEvent.setup();

    render(<OnboardingWizard />);

    await user.type(screen.getByLabelText("Razón social"), "Mitre S.A.");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText("Paso 2: Cuenta");

    await user.type(screen.getByLabelText("Nombre comercial"), "Mitre Comercial");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText("Paso 3: Bodega");

    await user.type(screen.getByLabelText("Nombre"), "Central");
    await user.type(screen.getByLabelText("Capacidad"), "100");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText("Paso 4: Admin cuenta");

    await user.type(screen.getByLabelText("Nombre"), "Ana Admin");
    await user.type(screen.getByLabelText("Correo"), "ana@mitre.com");
    await user.type(screen.getByLabelText("Clave"), "clave123");
    await user.click(screen.getByRole("button", { name: "Finalizar" }));

    await waitFor(() => {
      expect(createUsuarioConfigurator).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: "Ana Admin",
          idRol: WmsRol.administrador_cuenta,
          codigoCuenta: "CUE01",
          idBodega: null,
          correo: "ana@mitre.com",
          clave: "clave123",
        }),
      );
    });
  });

  it("muestra resumen final tras completar los 4 pasos", async () => {
    const user = userEvent.setup();

    render(<OnboardingWizard />);

    await user.type(screen.getByLabelText("Razón social"), "Mitre S.A.");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText("Paso 2: Cuenta");

    await user.type(screen.getByLabelText("Nombre comercial"), "Mitre Comercial");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText("Paso 3: Bodega");

    await user.type(screen.getByLabelText("Nombre"), "Central");
    await user.type(screen.getByLabelText("Capacidad"), "100");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByText("Paso 4: Admin cuenta");

    await user.type(screen.getByLabelText("Nombre"), "Ana Admin");
    await user.type(screen.getByLabelText("Correo"), "ana@mitre.com");
    await user.type(screen.getByLabelText("Clave"), "clave123");
    await user.click(screen.getByRole("button", { name: "Finalizar" }));

    await waitFor(() => {
      expect(screen.getByText("Tenant configurado")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Ver cuentas" })).toHaveAttribute(
      "href",
      "/configurador/creacion/cuentas",
    );
    expect(screen.getByRole("link", { name: "Ver usuarios" })).toHaveAttribute(
      "href",
      "/configurador/asignacion/usuarios",
    );
  });
});
