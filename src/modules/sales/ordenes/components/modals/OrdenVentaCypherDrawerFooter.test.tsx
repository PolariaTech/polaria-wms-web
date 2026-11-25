import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OrdenVentaCypherDrawerFooter } from "./OrdenVentaCypherDrawerFooter";

describe("OrdenVentaCypherDrawerFooter (REQ-350)", () => {
  it("habilita Borrar cuando puedeBorrar y avisa el alcance ampliado si no", () => {
    const { rerender } = render(
      <OrdenVentaCypherDrawerFooter
        puedeEditar={false}
        puedeAlmacen={false}
        puedeBorrar
        bloqueadoHastaConfirmar="bloqueado"
        busyKind={null}
        onEdit={vi.fn()}
        onPrint={vi.fn()}
        onPreview={vi.fn()}
        onBorrar={vi.fn()}
        onOpenBorrarConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Borrar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Borrar" })).toHaveAttribute(
      "title",
      "Cancelar orden (queda en listado como Cancelada)",
    );

    rerender(
      <OrdenVentaCypherDrawerFooter
        puedeEditar={false}
        puedeAlmacen={false}
        puedeBorrar={false}
        bloqueadoHastaConfirmar="bloqueado"
        busyKind={null}
        onEdit={vi.fn()}
        onPrint={vi.fn()}
        onPreview={vi.fn()}
        onBorrar={vi.fn()}
        onOpenBorrarConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Borrar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Borrar" })).toHaveAttribute(
      "title",
      "Solo disponible en órdenes por confirmar",
    );
  });
});
