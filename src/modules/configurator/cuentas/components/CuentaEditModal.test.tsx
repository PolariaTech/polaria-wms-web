import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CuentaEditModal } from "./CuentaEditModal";
import type { CuentaListRow } from "../services/cuentas.service";

const updateCuentaConfigurator = vi.fn();

vi.mock("../services/cuentas.service", () => ({
  updateCuentaConfigurator: (...args: unknown[]) =>
    updateCuentaConfigurator(...args),
}));

const CUENTA: CuentaListRow = {
  codigoCuenta: "023WA",
  codigoEmpresa: "JBR",
  nombreComercial: "JBR",
  bodegasAsignadas: [],
  bodegaInternaPrincipal: null,
  idBodegaDefault: null,
  estaActiva: true,
  accesoWms: true,
  accesoMateo: true,
  tieneCredenciales: true,
};

describe("CuentaEditModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateCuentaConfigurator.mockResolvedValue(CUENTA);
  });

  it("guarda el inicio de sesión de la cuenta sin productos", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    const onClose = vi.fn();

    render(
      <CuentaEditModal
        open
        cuenta={CUENTA}
        onClose={onClose}
        onUpdated={onUpdated}
      />,
    );

    expect(screen.queryByRole("button", { name: /Mateo IA/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: /Inicio de sesión/i }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(updateCuentaConfigurator).toHaveBeenCalledWith({
        codigoCuenta: "023WA",
        codigoEmpresa: "JBR",
        nombreComercial: "JBR",
        estaActiva: false,
      });
    });
    expect(onUpdated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
