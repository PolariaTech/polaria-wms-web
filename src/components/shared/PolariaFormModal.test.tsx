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
});
