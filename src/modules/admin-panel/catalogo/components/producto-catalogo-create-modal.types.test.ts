import { describe, expect, it } from "vitest";
import { CATALOGO_TIPO_PRIMARIO } from "../constants/catalogo-producto";
import { createInitialForm } from "./producto-catalogo-create-modal.types";

describe("createInitialForm", () => {
  it("inicia como primario con unidad de visualización cantidad", () => {
    const form = createInitialForm();
    expect(form.titulo).toBe("");
    expect(form.tipo).toBe(CATALOGO_TIPO_PRIMARIO);
    expect(form.unidadVisualizacion).toBe("cantidad");
  });

  it("devuelve un objeto nuevo en cada llamada", () => {
    expect(createInitialForm()).not.toBe(createInitialForm());
  });
});
