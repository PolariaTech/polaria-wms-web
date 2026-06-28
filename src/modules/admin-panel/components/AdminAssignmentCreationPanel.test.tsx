import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminAssignmentCreationPanel } from "./AdminAssignmentCreationPanel";

describe("AdminAssignmentCreationPanel", () => {
  it("muestra las secciones Creación y Asignaciones", () => {
    render(<AdminAssignmentCreationPanel />);

    expect(
      screen.getByRole("heading", { name: "Asignación y creación" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Creación" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Asignaciones" }),
    ).toBeInTheDocument();
  });

  it("lista las ocho opciones del menú", () => {
    render(<AdminAssignmentCreationPanel />);

    expect(
      screen.getByRole("button", { name: /Proveedores/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Clientes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Compradores/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Camiones/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Plantas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Usuarios/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Bodega interna/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Bodega externa/i }),
    ).toBeInTheDocument();
  });

  it("notifica al hacer clic en una opción", async () => {
    const user = userEvent.setup();
    const onCreationOptionClick = vi.fn();
    const onAssignmentOptionClick = vi.fn();

    render(
      <AdminAssignmentCreationPanel
        onCreationOptionClick={onCreationOptionClick}
        onAssignmentOptionClick={onAssignmentOptionClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Proveedores/i }));
    await user.click(screen.getByRole("button", { name: /Usuarios/i }));

    expect(onCreationOptionClick).toHaveBeenCalledWith("proveedores");
    expect(onAssignmentOptionClick).toHaveBeenCalledWith("usuarios");
  });
});
