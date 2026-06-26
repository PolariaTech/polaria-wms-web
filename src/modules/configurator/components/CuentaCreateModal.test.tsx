import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CuentaCreateModal } from "./CuentaCreateModal";

const listEmpresasAssignOptions = vi.fn();
const createCuentaConfigurator = vi.fn();

vi.mock("../services/cuentas.service", () => ({
  listEmpresasAssignOptions: (...args: unknown[]) =>
    listEmpresasAssignOptions(...args),
  createCuentaConfigurator: (...args: unknown[]) =>
    createCuentaConfigurator(...args),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (state: { session: { idUsuario: string } }) => unknown) =>
    selector({ session: { idUsuario: "user-1" } }),
}));

describe("CuentaCreateModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listEmpresasAssignOptions.mockResolvedValue([
      { codigoEmpresa: "ACME", razonSocial: "ACME Corp" },
    ]);
    createCuentaConfigurator.mockResolvedValue({
      codigoCuenta: "MIT00",
      nombreComercial: "Mitre",
      bodegaAsignada: "—",
      tieneCredenciales: false,
    });
  });

  it("carga empresas y envía codigoEmpresa seleccionado", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const onClose = vi.fn();

    render(
      <CuentaCreateModal open onClose={onClose} onCreated={onCreated} />,
    );

    await waitFor(() => {
      expect(listEmpresasAssignOptions).toHaveBeenCalled();
    });

    await user.selectOptions(
      screen.getByLabelText("Empresa"),
      "ACME",
    );
    await user.type(screen.getByLabelText("Nombre"), "Mitre");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() => {
      expect(createCuentaConfigurator).toHaveBeenCalledWith(
        expect.objectContaining({
          codigoEmpresa: "ACME",
          nombreComercial: "Mitre",
          idCreador: "user-1",
        }),
      );
    });
    expect(onCreated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("muestra error si no se selecciona empresa", async () => {
    const user = userEvent.setup();

    render(
      <CuentaCreateModal open onClose={vi.fn()} onCreated={vi.fn()} />,
    );

    await waitFor(() => {
      expect(listEmpresasAssignOptions).toHaveBeenCalled();
    });

    await user.type(screen.getByLabelText("Nombre"), "Mitre");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    expect(
      await screen.findByText("Selecciona la empresa a asociar."),
    ).toBeInTheDocument();
    expect(createCuentaConfigurator).not.toHaveBeenCalled();
  });
});
