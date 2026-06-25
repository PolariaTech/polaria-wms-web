import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import { ConfiguratorActionsGrid } from "./ConfiguratorActionsGrid";

describe("ConfiguratorActionsGrid", () => {
  it("navega a sub-ruta al hacer clic en tarjeta de creación", async () => {
    const user = userEvent.setup();
    const onActionClick = vi.fn();

    render(<ConfiguratorActionsGrid onActionClick={onActionClick} />);

    await user.click(
      screen.getByRole("button", { name: /Creación Crea y gestiona/i }),
    );

    expect(onActionClick).toHaveBeenCalledOnce();
    expect(onActionClick).toHaveBeenCalledWith("creation");
  });

  it("expone href de integración en la acción", async () => {
    const user = userEvent.setup();
    const onActionClick = vi.fn();

    render(<ConfiguratorActionsGrid onActionClick={onActionClick} />);

    await user.click(
      screen.getByRole("button", {
        name: /Integración Gestiona integraciones externas/i,
      }),
    );

    expect(onActionClick).toHaveBeenCalledWith("integration");
  });
});

describe("ConfiguratorActionsGrid — href esperado", () => {
  it("creation debe resolver a /configurador/creacion", () => {
    expect(ROUTES.configuratorCreation).toBe("/configurador/creacion");
  });
});
