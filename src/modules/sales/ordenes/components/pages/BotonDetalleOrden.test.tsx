import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BotonDetalleOrden } from "./BotonDetalleOrden";

describe("BotonDetalleOrden (REQ-104)", () => {
  it("cerrado muestra «+» y se llama «Ver detalle» de esa orden", () => {
    const { container } = render(
      <BotonDetalleOrden abierto={false} venta="OV-00001395" onAlternar={vi.fn()} />,
    );

    const boton = screen.getByRole("button", { name: "Ver detalle de OV-00001395" });
    expect(boton).toHaveAttribute("aria-pressed", "false");
    expect(boton).toHaveAttribute("title", "Ver detalle");
    expect(container.querySelector("svg.lucide-plus")).not.toBeNull();
    expect(container.querySelector("svg.lucide-minus")).toBeNull();
  });

  it("abierto muestra «−» y se llama «Cerrar detalle» de esa orden", () => {
    const { container } = render(
      <BotonDetalleOrden abierto venta="OV-00001395" onAlternar={vi.fn()} />,
    );

    const boton = screen.getByRole("button", { name: "Cerrar detalle de OV-00001395" });
    expect(boton).toHaveAttribute("aria-pressed", "true");
    expect(boton).toHaveAttribute("title", "Cerrar detalle");
    expect(container.querySelector("svg.lucide-minus")).not.toBeNull();
    expect(container.querySelector("svg.lucide-plus")).toBeNull();
  });

  it("al pulsarlo pide alternar el panel", async () => {
    const onAlternar = vi.fn();
    const user = userEvent.setup();
    render(<BotonDetalleOrden abierto={false} venta="OV-00001395" onAlternar={onAlternar} />);

    await user.click(screen.getByRole("button"));
    expect(onAlternar).toHaveBeenCalledTimes(1);
  });
});
