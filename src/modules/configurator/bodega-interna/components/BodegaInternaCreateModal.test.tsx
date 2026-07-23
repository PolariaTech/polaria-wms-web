import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BodegaInternaCreateModal } from "./BodegaInternaCreateModal";

const listCuentasAssignOptions = vi.fn();
const createBodegaInternaConfigurator = vi.fn();

vi.mock("@/modules/configurator/usuarios/services/usuarios.service", () => ({
  listCuentasAssignOptions: (...args: unknown[]) =>
    listCuentasAssignOptions(...args),
}));

vi.mock("../services/bodegas-internas.service", () => ({
  createBodegaInternaConfigurator: (...args: unknown[]) =>
    createBodegaInternaConfigurator(...args),
}));

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (state: { session: { idUsuario: string } }) => unknown) =>
    selector({ session: { idUsuario: "user-1" } }),
}));

describe("BodegaInternaCreateModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listCuentasAssignOptions.mockResolvedValue([
      { codigoCuenta: "MIT00", nombreComercial: "Mitre" },
    ]);
    createBodegaInternaConfigurator.mockResolvedValue({
      idBodega: "bodega-1",
      nombre: "Central",
      capacidad: 80,
      bodegaAsignada: "Mitre",
    });
  });

  it("carga cuentas y envía codigoCuenta seleccionado", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const onClose = vi.fn();

    render(
      <BodegaInternaCreateModal
        open
        onClose={onClose}
        onCreated={onCreated}
      />,
    );

    await waitFor(() => {
      expect(listCuentasAssignOptions).toHaveBeenCalled();
    });

    await user.click(
      screen.getByRole("button", { name: "Buscar Cuenta destino" }),
    );
    await user.click(screen.getByRole("button", { name: "Seleccionar Mitre" }));
    await user.type(screen.getByLabelText("Nombre"), "Central Norte");
    await user.type(screen.getByLabelText("Capacidad"), "80");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() => {
      expect(createBodegaInternaConfigurator).toHaveBeenCalledWith({
        nombre: "Central Norte",
        capacidad: 80,
        codigoCuenta: "MIT00",
        idCreador: "user-1",
      });
    });
    expect(onCreated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("muestra error si no se selecciona cuenta destino", async () => {
    const user = userEvent.setup();

    render(
      <BodegaInternaCreateModal
        open
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(listCuentasAssignOptions).toHaveBeenCalled();
    });

    await user.type(screen.getByLabelText("Nombre"), "Central Norte");
    await user.type(screen.getByLabelText("Capacidad"), "80");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    expect(
      await screen.findByText("Selecciona la cuenta destino."),
    ).toBeInTheDocument();
    expect(createBodegaInternaConfigurator).not.toHaveBeenCalled();
  });
});
