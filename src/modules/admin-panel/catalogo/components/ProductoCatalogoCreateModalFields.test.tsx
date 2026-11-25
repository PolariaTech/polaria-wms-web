import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createInitialForm } from "./producto-catalogo-create-modal.types";
import { ProductoCatalogoCreateModalFields } from "./ProductoCatalogoCreateModalFields";

describe("ProductoCatalogoCreateModalFields", () => {
  it("propaga el título y compone los subformularios SEO y logística", async () => {
    const user = userEvent.setup();
    const patch = vi.fn();
    render(
      <ProductoCatalogoCreateModalFields
        form={createInitialForm()}
        patch={patch}
        isSubmitting={false}
        primarios={[]}
      />,
    );

    await user.type(screen.getByLabelText("Título *"), "a");
    expect(patch).toHaveBeenCalledWith({ titulo: "a" });
    expect(screen.getByLabelText("Título SEO")).toBeInTheDocument();
    expect(screen.getByLabelText("Servicio logística")).toBeInTheDocument();
  });

  it("deshabilita el formulario mientras se envía", () => {
    render(
      <ProductoCatalogoCreateModalFields
        form={createInitialForm()}
        patch={vi.fn()}
        isSubmitting
        primarios={[]}
      />,
    );
    expect(screen.getByLabelText("Título *")).toBeDisabled();
  });
});
