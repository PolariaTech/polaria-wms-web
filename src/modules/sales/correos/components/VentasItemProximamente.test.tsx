import { render, screen } from "@testing-library/react";
import { Camera } from "lucide-react";
import { describe, expect, it } from "vitest";
import { VentasItemProximamente } from "./VentasItemProximamente";

describe("VentasItemProximamente", () => {
  it("muestra la opción apagada y avisa «Próximamente»", () => {
    const { container } = render(<VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />);

    const item = screen.getByText("Estado de fotos").closest("[aria-disabled='true']");
    expect(item).not.toBeNull();
    expect(item).toHaveClass("cursor-not-allowed");
    expect(screen.getByText("Próximamente")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("no es un enlace ni un botón: no lleva a ninguna parte", () => {
    render(<VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("acepta clases extra para acomodarse en el menú", () => {
    render(<VentasItemProximamente icono={Camera} etiqueta="Estado de fotos" className="lg:ml-4" />);

    expect(screen.getByText("Estado de fotos").closest("[aria-disabled='true']")).toHaveClass("lg:ml-4");
  });
});
