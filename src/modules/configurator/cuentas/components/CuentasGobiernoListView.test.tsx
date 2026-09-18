import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CuentasGobiernoListView } from "./CuentasGobiernoListView";

const mockPush = vi.fn();
const listCuentasGobiernoConfigurator = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("../services/cuentas.service", () => ({
  listCuentasGobiernoConfigurator: (...args: unknown[]) =>
    listCuentasGobiernoConfigurator(...args),
}));

describe("CuentasGobiernoListView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listCuentasGobiernoConfigurator.mockResolvedValue([
      {
        codigoCuenta: "MIT00",
        codigoEmpresa: "ACME",
        empresaNombre: "ACME Corp",
        nombreComercial: "Mitre",
        bodegasAsignadas: [],
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
      },
    ]);
  });

  it("abre el control de la cuenta al hacer clic en la fila", async () => {
    const user = userEvent.setup();

    render(<CuentasGobiernoListView />);

    await waitFor(() => {
      expect(screen.getByText("Mitre")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Abrir control de Mitre" }));

    expect(mockPush).toHaveBeenCalledWith("/configurador/cuentas/MIT00");
  });
});
