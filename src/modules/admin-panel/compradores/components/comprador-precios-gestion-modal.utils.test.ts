import { describe, expect, it } from "vitest";
import {
  ACTION_BUTTON_PRIMARY_CLASS,
  ACTION_BUTTON_SECONDARY_CLASS,
  formatPrecioPreview,
  modalStepDescription,
  modalStepSize,
  toggleValue,
} from "./comprador-precios-gestion-modal.utils";

describe("comprador-precios-gestion-modal.utils", () => {
  it("toggleValue agrega y quita valores", () => {
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
  });

  it("formatPrecioPreview devuelve guion para valores no finitos", () => {
    expect(formatPrecioPreview(null)).toBe("—");
    expect(formatPrecioPreview(Number.NaN)).toBe("—");
    expect(formatPrecioPreview(10)).toContain("10");
  });

  it("modalStepDescription cubre cada paso", () => {
    expect(modalStepDescription("acciones")).toContain("acción");
    expect(modalStepDescription("exportar")).toContain("exportar");
    expect(modalStepDescription("imprimir")).toContain("Excel");
    expect(modalStepDescription("importar-preview")).toContain("importación");
  });

  it("modalStepSize usa tamaño según el paso", () => {
    expect(modalStepSize("acciones")).toBe("sm");
    expect(modalStepSize("importar-preview")).toBe("2xl");
    expect(modalStepSize("exportar")).toBe("md");
    expect(modalStepSize("imprimir")).toBe("md");
  });

  it("clases de botón incluyen estilos esperados", () => {
    expect(ACTION_BUTTON_SECONDARY_CLASS).toContain("border-polaria-t-20");
    expect(ACTION_BUTTON_PRIMARY_CLASS).toContain("bg-polaria-teal");
  });
});
