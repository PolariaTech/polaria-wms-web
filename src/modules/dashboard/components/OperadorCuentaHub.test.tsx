import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { OperadorCuentaHub } from "./OperadorCuentaHub";

describe("OperadorCuentaHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza las cuatro opciones del hub", () => {
    render(<OperadorCuentaHub />);

    expect(
      screen.getByRole("heading", { name: "Operación de cuenta" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Proveedor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bodega externa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bodega interna" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ventas" })).toBeInTheDocument();
  });

  it("navega al seleccionar bodega externa", async () => {
    const user = userEvent.setup();

    render(<OperadorCuentaHub />);

    await user.click(screen.getByRole("button", { name: "Bodega externa" }));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.dashboardBodegaExternaCuenta);
  });

  it("navega al seleccionar bodega interna", async () => {
    const user = userEvent.setup();

    render(<OperadorCuentaHub />);

    await user.click(screen.getByRole("button", { name: "Bodega interna" }));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.dashboardBodegaInternaCuenta);
  });

  it("navega al seleccionar ventas", async () => {
    const user = userEvent.setup();

    render(<OperadorCuentaHub />);

    await user.click(screen.getByRole("button", { name: "Ventas" }));

    expect(mockPush).toHaveBeenCalledWith(ROUTES.dashboardVentas);
  });
});
