import { describe, expect, it } from "vitest";
import { CATALOGO_TIPO_PRIMARIO } from "../constants/catalogo-producto";
import { createEditInitialForm } from "./producto-catalogo-edit-modal.types";

describe("createEditInitialForm", () => {
  it("inicia vacío como primario", () => {
    const form = createEditInitialForm();
    expect(form.sku).toBe("");
    expect(form.tipo).toBe(CATALOGO_TIPO_PRIMARIO);
  });
});
