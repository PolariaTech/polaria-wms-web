import { describe, expect, it } from "vitest";
import {
  CATALOGO_TIPO_SECUNDARIO,
} from "../constants/catalogo-producto";
import { CATALOGO_BASE_PRIMARIO_LABEL } from "../constants/catalogo-conversion";
import { createSecundarioInitialForm } from "./producto-secundario-create-modal.types";

describe("createSecundarioInitialForm", () => {
  it("inicia como secundario con conversión por defecto", () => {
    const form = createSecundarioInitialForm();
    expect(form.tipo).toBe(CATALOGO_TIPO_SECUNDARIO);
    expect(form.basePrimario).toBe(CATALOGO_BASE_PRIMARIO_LABEL);
    expect(form.gramosPorUnidad).toBe("200");
    expect(form.mermaPct).toBe("0");
    expect(form.idProductoPrimario).toBe("");
  });
});
