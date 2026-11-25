import { describe, expect, it } from "vitest";
import { createSecundarioInitialForm } from "./producto-secundario-create-modal.types";
import { validateProductoSecundarioForm } from "./producto-secundario-create-modal.validate";

function validForm() {
  return {
    ...createSecundarioInitialForm(),
    titulo: "Filete 200 g",
    descripcion: "Descripción",
    proveedor: "Proveedor A",
    categoria: "Aves",
    idProductoPrimario: "prim-1",
  };
}

describe("validateProductoSecundarioForm", () => {
  it("valida el formulario completo y calcula conversión", () => {
    const result = validateProductoSecundarioForm(validForm());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.titulo).toBe("Filete 200 g");
      expect(result.gramos).toBe(200);
      expect(result.mermaPct).toBe(0);
      expect(result.unidadesPorKg).toBe(5);
      expect(result.sku).toBeTruthy();
    }
  });

  it.each([
    [{ titulo: "  " }, "El título es obligatorio."],
    [{ descripcion: "" }, "La descripción es obligatoria."],
    [{ proveedor: "" }, "El proveedor es obligatorio."],
    [{ categoria: "" }, "La categoría es obligatoria."],
    [{ estado: "" }, "El estado es obligatorio."],
    [{ unidadMedida: "" }, "La unidad es obligatoria."],
    [{ idProductoPrimario: "" }, "Selecciona el producto primario incluido."],
    [
      { gramosPorUnidad: "0" },
      "Los gramos por unidad deben ser mayores a cero.",
    ],
    [{ mermaPct: "150" }, "El % de merma debe estar entre 0 y 100."],
  ])("rechaza %j", (patch, error) => {
    const result = validateProductoSecundarioForm({ ...validForm(), ...patch });
    expect(result).toEqual({ ok: false, error });
  });
});
