import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JefeBodegaActionBar } from "./JefeBodegaActionBar";

describe("JefeBodegaActionBar", () => {
  it("muestra los cinco accesos y abre modal al hacer clic", async () => {
    const user = userEvent.setup();
    const onActionClick = vi.fn();

    render(<JefeBodegaActionBar onActionClick={onActionClick} />);

    expect(screen.getByRole("button", { name: /Ingresos/i })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /Órdenes de venta/i }),
    ).toBeEnabled();
    expect(screen.getByText("Descargar copia")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Ingresos/i }));
    expect(onActionClick).toHaveBeenCalledWith("ingresos");

    await user.click(screen.getByRole("button", { name: /Bodega a Bodega/i }));
    expect(onActionClick).toHaveBeenCalledWith("bodega-a-bodega");

    await user.click(screen.getByRole("button", { name: /Órdenes de venta/i }));
    expect(onActionClick).toHaveBeenCalledWith("ordenes-venta");
  });
});
