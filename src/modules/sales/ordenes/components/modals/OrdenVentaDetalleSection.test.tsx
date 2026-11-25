import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { OrdenVentaDetalleSection } from "./OrdenVentaDetalleSection";

describe("OrdenVentaDetalleSection", () => {
  it("no plegable: título como encabezado y contenido siempre visible", () => {
    render(
      <OrdenVentaDetalleSection title="Productos">
        <p>contenido</p>
      </OrdenVentaDetalleSection>,
    );
    expect(screen.getByRole("heading", { name: "Productos" })).toBeInTheDocument();
    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("plegable: abierto por defecto y se pliega al pulsar el título", async () => {
    render(
      <OrdenVentaDetalleSection title="Notas" collapsible>
        <p>contenido</p>
      </OrdenVentaDetalleSection>,
    );
    const boton = screen.getByRole("button", { name: "Notas" });
    expect(boton).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("contenido")).toBeNull();
    await userEvent.click(boton);
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("plegable con defaultOpen=false arranca cerrado", () => {
    render(
      <OrdenVentaDetalleSection title="Notas" collapsible defaultOpen={false}>
        <p>contenido</p>
      </OrdenVentaDetalleSection>,
    );
    expect(screen.getByRole("button", { name: "Notas" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("contenido")).toBeNull();
  });
});
