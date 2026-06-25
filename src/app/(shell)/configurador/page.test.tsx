import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import ConfiguradorPage from "@/app/(shell)/configurador/page";

describe("ConfiguradorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navega a /configurador/creacion al seleccionar tarjeta Creación", async () => {
    const user = userEvent.setup();

    render(<ConfiguradorPage />);

    await user.click(
      screen.getByRole("button", { name: /Creación Crea y gestiona/i }),
    );

    expect(mockPush).toHaveBeenCalledWith(ROUTES.configuratorCreation);
  });

  it("navega a /configurador/asignacion al seleccionar tarjeta Asignación", async () => {
    const user = userEvent.setup();

    render(<ConfiguradorPage />);

    await user.click(
      screen.getByRole("button", {
        name: /Creación y asignación Crea recursos/i,
      }),
    );

    expect(mockPush).toHaveBeenCalledWith(ROUTES.configuratorAssignment);
  });
});
