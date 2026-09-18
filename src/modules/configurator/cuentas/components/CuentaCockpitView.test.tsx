import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CuentaCockpitView } from "./CuentaCockpitView";

const mockPush = vi.fn();
const getCuentaGobiernoConfigurator = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("../services/cuentas.service", () => ({
  getCuentaGobiernoConfigurator: (...args: unknown[]) =>
    getCuentaGobiernoConfigurator(...args),
  updateCuentaConfigurator: vi.fn(),
  updateCuentaBodegaDefaultConfigurator: vi.fn(),
}));

describe("CuentaCockpitView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCuentaGobiernoConfigurator.mockResolvedValue({
      codigoCuenta: "MIT00",
      codigoEmpresa: "ACME",
      empresaNombre: "ACME Corp",
      nombreComercial: "Mitre",
      bodegasAsignadas: [
        {
          idBodega: "b1",
          nombre: "Principal",
          tipo: "interna",
          capacidad: 10,
        },
      ],
      bodegaInternaPrincipal: {
        idBodega: "b1",
        nombre: "Principal",
        tipo: "interna",
        capacidad: 10,
      },
      idBodegaDefault: "b1",
      estaActiva: true,
      accesoWms: true,
      accesoMateo: true,
      tieneCredenciales: true,
    });
  });

  it("muestra la ficha de la cuenta y navega a usuarios", async () => {
    const user = userEvent.setup();

    render(<CuentaCockpitView codigoCuenta="MIT00" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Mitre" })).toBeInTheDocument();
    });

    expect(screen.getByText("MIT00 · ACME Corp")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Usuarios$/i }));

    expect(mockPush).toHaveBeenCalledWith("/configurador/cuentas/MIT00/usuarios");
  });

  it("muestra la card de carga al estilo SSO mientras llega la cuenta", () => {
    getCuentaGobiernoConfigurator.mockReturnValue(new Promise(() => {}));

    render(<CuentaCockpitView codigoCuenta="023WA" />);

    expect(
      screen.getByRole("heading", { name: "Cargando cuenta…" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Estamos abriendo el control de esta cuenta."),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("abre el modal de acceso", async () => {
    const user = userEvent.setup();

    render(<CuentaCockpitView codigoCuenta="MIT00" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Mitre" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /^Acceso$/i }));

    expect(screen.getByRole("heading", { name: "Editar cuenta" })).toBeInTheDocument();
  });
});
