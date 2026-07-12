import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JefeBodegaIngresoModal } from "./JefeBodegaIngresoModal";

vi.mock("@/modules/inventory/shared/services/inventory.service", () => ({
  listWarehouseState: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../services/jefe-bodega-operarios.service", () => ({
  listOperariosBodegaDisponibles: vi.fn().mockResolvedValue([]),
}));

describe("JefeBodegaIngresoModal", () => {
  it("muestra campos del flujo de ingreso", () => {
    render(<JefeBodegaIngresoModal open onClose={() => undefined} />);

    expect(
      screen.getByRole("heading", { name: "Registrar entrada" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Generar orden de ingreso")).toBeInTheDocument();
    expect(screen.getByLabelText("Origen")).toHaveValue("Ingresos");
    expect(screen.getByText("Producto en ingreso")).toBeInTheDocument();
    expect(screen.getByText("Posición en bodega")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear ingreso" })).toBeDisabled();
  });

  it("cierra al cancelar", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<JefeBodegaIngresoModal open onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
