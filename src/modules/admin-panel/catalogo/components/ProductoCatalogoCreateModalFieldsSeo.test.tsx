import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createInitialForm } from "./producto-catalogo-create-modal.types";
import { ProductoCatalogoCreateModalFieldsSeo } from "./ProductoCatalogoCreateModalFieldsSeo";

describe("ProductoCatalogoCreateModalFieldsSeo", () => {
  it("propaga cambios del título SEO", async () => {
    const user = userEvent.setup();
    const patch = vi.fn();
    render(
      <ProductoCatalogoCreateModalFieldsSeo
        form={createInitialForm()}
        patch={patch}
        isSubmitting={false}
      />,
    );
    await user.type(screen.getByLabelText("Título SEO"), "a");
    expect(patch).toHaveBeenCalledWith({ tituloSeo: "a" });
  });

  it("deshabilita campos al enviar", () => {
    render(
      <ProductoCatalogoCreateModalFieldsSeo
        form={createInitialForm()}
        patch={vi.fn()}
        isSubmitting
      />,
    );
    expect(screen.getByLabelText("Título SEO")).toBeDisabled();
  });
});
