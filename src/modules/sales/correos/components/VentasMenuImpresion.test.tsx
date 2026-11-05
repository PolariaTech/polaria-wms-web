import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes";
import { VentasMenuImpresion } from "./VentasMenuImpresion";

const GRUPO = { name: "Impresión en batch" };

describe("VentasMenuImpresion", () => {
  it("arranca cerrado cuando no se está en una pantalla de impresión", () => {
    render(<VentasMenuImpresion pathname={ROUTES.dashboardVentasOrdenes} />);

    expect(screen.getByRole("button", GRUPO)).toHaveAttribute("aria-expanded", "false");
    // Cerrado, la lista queda oculta (en jsdom no hay CSS: se comprueba la clase que la oculta).
    expect(screen.getByRole("list", { hidden: true })).toHaveClass("hidden");
  });

  it("al abrirlo ofrece la impresión detallada, que lleva a la pantalla de elegir OV y OT", async () => {
    render(<VentasMenuImpresion pathname={ROUTES.dashboardVentasOrdenes} />);

    await userEvent.click(screen.getByRole("button", GRUPO));

    expect(screen.getByRole("button", GRUPO)).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Impresión detallada" })).toHaveAttribute(
      "href",
      ROUTES.dashboardVentasImpresionBatch,
    );
    expect(screen.getByRole("link", { name: "Impresión detallada" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("la impresión rápida es un enlace a su pantalla y ya no dice «Próximamente»", async () => {
    render(<VentasMenuImpresion pathname={ROUTES.dashboardVentasOrdenes} />);
    await userEvent.click(screen.getByRole("button", GRUPO));

    expect(screen.getByRole("link", { name: "Impresión rápida" })).toHaveAttribute(
      "href",
      ROUTES.dashboardVentasImpresionRapida,
    );
    expect(screen.queryByText("Próximamente")).not.toBeInTheDocument();
  });

  it("dentro de la impresión rápida arranca abierto y marca solo esa opción como actual", () => {
    render(<VentasMenuImpresion pathname={ROUTES.dashboardVentasImpresionRapida} />);

    expect(screen.getByRole("button", GRUPO)).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Impresión rápida" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Impresión detallada" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("dentro de la impresión detallada arranca abierto y la marca como la página actual", () => {
    render(<VentasMenuImpresion pathname={ROUTES.dashboardVentasImpresionBatch} />);

    expect(screen.getByRole("button", GRUPO)).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Impresión detallada" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("se abre solo si se llega a la impresión por otro camino", () => {
    const { rerender } = render(<VentasMenuImpresion pathname={ROUTES.dashboardVentasOrdenes} />);
    expect(screen.getByRole("button", GRUPO)).toHaveAttribute("aria-expanded", "false");

    rerender(<VentasMenuImpresion pathname={ROUTES.dashboardVentasImpresionBatch} />);

    expect(screen.getByRole("button", GRUPO)).toHaveAttribute("aria-expanded", "true");
  });

  it("se puede cerrar de nuevo, y el control siempre apunta a una lista que existe", async () => {
    render(<VentasMenuImpresion pathname={ROUTES.dashboardVentasImpresionBatch} />);
    const boton = screen.getByRole("button", GRUPO);

    await userEvent.click(boton);

    expect(boton).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(boton.getAttribute("aria-controls") ?? "")).not.toBeNull();
  });
});
