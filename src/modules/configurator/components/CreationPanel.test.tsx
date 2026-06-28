import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreationOptionsGrid } from "@/modules/configurator/components/CreationOptionsGrid";
import { CreationPanel } from "@/modules/configurator/components/CreationPanel";

describe("CreationPanel", () => {
  it("muestra título, subtítulo y las opciones de creación", () => {
    render(<CreationPanel />);

    expect(
      screen.getByRole("heading", { name: "Creación", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Selecciona el tipo de entidad que deseas crear"),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Empresas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cuentas" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bodega interna" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bodega externa" }),
    ).toBeInTheDocument();
  });
});

describe("CreationOptionsGrid", () => {
  it("notifica al hacer clic en una opción", async () => {
    const user = userEvent.setup();
    const onOptionClick = vi.fn();

    render(<CreationOptionsGrid onOptionClick={onOptionClick} />);

    await user.click(screen.getByRole("button", { name: "Cuentas" }));

    expect(onOptionClick).toHaveBeenCalledWith("cuentas");
  });
});
