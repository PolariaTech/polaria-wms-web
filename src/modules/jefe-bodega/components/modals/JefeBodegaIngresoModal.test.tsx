import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JefeBodegaIngresoModal } from "./JefeBodegaIngresoModal";

describe("JefeBodegaIngresoModal", () => {
  it("muestra campos del flujo de ingreso", () => {
    render(<JefeBodegaIngresoModal open onClose={() => undefined} />);

    expect(
      screen.getByRole("heading", { name: "Registrar entrada" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Generar orden de ingreso")).toBeInTheDocument();
    expect(screen.getByLabelText("Origen")).toHaveValue("Ingresos");
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
