import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildCatalogoConversionPreview } from "../constants/catalogo-conversion";
import { createSecundarioInitialForm } from "./producto-secundario-create-modal.types";
import { ProductoSecundarioCreateModalFields } from "./ProductoSecundarioCreateModalFields";

function renderFields(overrides: { disabled?: boolean } = {}) {
  const patch = vi.fn();
  const onOpenPrimarioPicker = vi.fn();
  const form = createSecundarioInitialForm();
  render(
    <ProductoSecundarioCreateModalFields
      form={form}
      patch={patch}
      disabled={overrides.disabled ?? false}
      isLoadingOptions={false}
      proveedorSelectOptions={[{ value: "Prov", label: "Prov" }]}
      categoriaSelectOptions={[{ value: "Aves", label: "Aves" }]}
      unidadLabel="kg"
      primarioLabel="Pollo"
      conversionPreview={buildCatalogoConversionPreview("200", "0")}
      conversionPreviewReady={false}
      onOpenUnidadPicker={vi.fn()}
      onOpenPrimarioPicker={onOpenPrimarioPicker}
    />,
  );
  return { patch, onOpenPrimarioPicker };
}

describe("ProductoSecundarioCreateModalFields", () => {
  it("propaga el título al formulario", async () => {
    const user = userEvent.setup();
    const { patch } = renderFields();
    await user.type(screen.getByLabelText("Título *"), "F");
    expect(patch).toHaveBeenCalledWith({ titulo: "F" });
  });

  it("deshabilita campos cuando disabled", () => {
    renderFields({ disabled: true });
    expect(screen.getByLabelText("Título *")).toBeDisabled();
  });
});
