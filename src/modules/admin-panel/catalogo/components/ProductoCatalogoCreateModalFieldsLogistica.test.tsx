import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createInitialForm } from "./producto-catalogo-create-modal.types";
import { ProductoCatalogoCreateModalFieldsLogistica } from "./ProductoCatalogoCreateModalFieldsLogistica";

const primarios = [
  {
    idProducto: "p1",
    label: "Pollo (S1)",
    titulo: "Pollo",
    codigo: "C1",
    sku: "S1",
    categoria: "",
    proveedor: "",
  },
];

describe("ProductoCatalogoCreateModalFieldsLogistica", () => {
  it("selecciona el primario incluido", async () => {
    const user = userEvent.setup();
    const patch = vi.fn();
    render(
      <ProductoCatalogoCreateModalFieldsLogistica
        form={createInitialForm()}
        patch={patch}
        isSubmitting={false}
        primarios={primarios}
      />,
    );
    await user.selectOptions(screen.getByLabelText("Incluido primario"), "p1");
    expect(patch).toHaveBeenCalledWith({ incluidoPrimarioId: "p1" });
  });

  it("propaga el servicio de logística", async () => {
    const user = userEvent.setup();
    const patch = vi.fn();
    render(
      <ProductoCatalogoCreateModalFieldsLogistica
        form={createInitialForm()}
        patch={patch}
        isSubmitting={false}
        primarios={[]}
      />,
    );
    await user.type(screen.getByLabelText("Servicio logística"), "x");
    expect(patch).toHaveBeenCalledWith({ servicioLogistica: "x" });
  });
});
