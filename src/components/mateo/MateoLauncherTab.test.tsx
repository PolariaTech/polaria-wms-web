import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MateoLauncherTab } from "./MateoLauncherTab";

describe("MateoLauncherTab", () => {
  it("con Mateo visible ofrece ocultarlo, con la flecha hacia el borde", async () => {
    const onAlternar = vi.fn();
    const { container } = render(<MateoLauncherTab oculto={false} onAlternar={onAlternar} />);

    const boton = screen.getByRole("button", { name: "Ocultar Mateo Soporte" });
    expect(boton).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector("svg.lucide-chevron-right")).not.toBeNull();
    await userEvent.click(boton);
    expect(onAlternar).toHaveBeenCalledTimes(1);
  });

  it("con Mateo oculto ofrece mostrarlo, con la flecha hacia el contenido", () => {
    const { container } = render(<MateoLauncherTab oculto onAlternar={vi.fn()} />);

    const boton = screen.getByRole("button", { name: "Mostrar Mateo Soporte" });
    expect(boton).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelector("svg.lucide-chevron-left")).not.toBeNull();
  });

  it("queda pegada al borde derecho y por encima del widget", () => {
    render(<MateoLauncherTab oculto={false} onAlternar={vi.fn()} />);
    const boton = screen.getByTestId("mateo-launcher-tab");
    expect(boton).toHaveClass("fixed", "right-0", "z-[101]");
  });
});
