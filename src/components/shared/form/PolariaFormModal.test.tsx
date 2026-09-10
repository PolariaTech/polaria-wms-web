import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PolariaFormModal } from "./PolariaFormModal";

describe("PolariaFormModal", () => {
  it("renderiza encabezado, campos y acciones", () => {
    render(
      <PolariaFormModal
        open
        onClose={() => undefined}
        sectionLabel="Nueva cuenta"
        title="Crear cuenta"
        description="Completa los campos para registrar una cuenta."
        onSubmit={(event) => event.preventDefault()}
        submitLabel="Crear"
      >
        <input aria-label="Campo demo" />
      </PolariaFormModal>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Nueva cuenta")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Crear cuenta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
  });

  it("ejecuta onClose al cancelar", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <PolariaFormModal
        open
        onClose={onClose}
        title="Crear cuenta"
        onSubmit={(event) => event.preventDefault()}
      >
        <input aria-label="Campo demo" />
      </PolariaFormModal>,
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("oculta el Cerrar de cabecera cuando hideHeaderClose está activo", () => {
    render(
      <PolariaFormModal
        open
        onClose={() => undefined}
        title="Pedido"
        hideHeaderClose
        onSubmit={(event) => event.preventDefault()}
        submitLabel="Validar y enviar"
      >
        <input aria-label="Campo demo" />
      </PolariaFormModal>,
    );

    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Validar y enviar" })).toBeInTheDocument();
  });

  it("aplica ancho según size", () => {
    render(
      <PolariaFormModal
        open
        onClose={() => undefined}
        title="Modal ancho"
        size="xl"
        onSubmit={(event) => event.preventDefault()}
      >
        <input aria-label="Campo demo" />
      </PolariaFormModal>,
    );

    expect(screen.getByRole("dialog")).toHaveClass("max-w-4xl");
  });

  it("mantiene el panel fijo y scrollea el cuerpo, sin overflow en el overlay", () => {
    render(
      <PolariaFormModal
        open
        onClose={() => undefined}
        title="Pedido"
        onSubmit={(event) => event.preventDefault()}
      >
        <input aria-label="Campo demo" />
      </PolariaFormModal>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("overflow-hidden");
    expect(dialog.parentElement).toHaveClass("overflow-hidden");
    expect(dialog.parentElement).not.toHaveClass("overflow-y-auto");
  });
});
