import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssignmentPanel } from "@/modules/configurator/shared/components/AssignmentPanel";

describe("AssignmentPanel", () => {
  it("muestra título, subtítulo y tarjeta Usuarios", () => {
    render(<AssignmentPanel />);

    expect(
      screen.getByRole("heading", {
        name: "Creación y asignación",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Selecciona el tipo de recurso que deseas gestionar"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usuarios" })).toBeInTheDocument();
  });
});
