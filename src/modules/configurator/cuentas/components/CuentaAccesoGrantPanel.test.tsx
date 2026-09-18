import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CuentaAccesoGrantPanel } from "./CuentaAccesoGrantPanel";

describe("CuentaAccesoGrantPanel", () => {
  it("concede y revoca productos con un clic", async () => {
    const user = userEvent.setup();
    const onToggleWms = vi.fn();
    const onToggleMateo = vi.fn();

    render(
      <CuentaAccesoGrantPanel
        estaActiva
        accesoWms
        accesoMateo
        onToggleActiva={vi.fn()}
        onToggleWms={onToggleWms}
        onToggleMateo={onToggleMateo}
      />,
    );

    expect(screen.getByRole("button", { name: /Polaria WMS/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: /Mateo IA/i }));
    expect(onToggleMateo).toHaveBeenCalledTimes(1);
  });

  it("no quita el último producto concedido", async () => {
    const user = userEvent.setup();
    const onToggleWms = vi.fn();

    render(
      <CuentaAccesoGrantPanel
        estaActiva
        accesoWms
        accesoMateo={false}
        onToggleActiva={vi.fn()}
        onToggleWms={onToggleWms}
        onToggleMateo={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Polaria WMS/i }));
    expect(onToggleWms).not.toHaveBeenCalled();
  });

  it("muestra inicio de sesión como switch de acceso", async () => {
    const user = userEvent.setup();
    const onToggleActiva = vi.fn();

    render(
      <CuentaAccesoGrantPanel
        estaActiva
        accesoWms
        accesoMateo
        onToggleActiva={onToggleActiva}
        onToggleWms={vi.fn()}
        onToggleMateo={vi.fn()}
      />,
    );

    const loginSwitch = screen.getByRole("switch", { name: /Inicio de sesión/i });
    expect(loginSwitch).toHaveAttribute("aria-checked", "true");

    await user.click(loginSwitch);
    expect(onToggleActiva).toHaveBeenCalledTimes(1);
  });
});
