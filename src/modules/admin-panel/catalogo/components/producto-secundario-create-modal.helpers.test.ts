import { describe, expect, it } from "vitest";
import {
  formatPrimarioLabel,
  mergeCategoriaOptions,
} from "./producto-secundario-create-modal.helpers";

describe("producto-secundario-create-modal.helpers", () => {
  it("mergeCategoriaOptions agrega categorías nuevas y omite vacías y guion", () => {
    const options = mergeCategoriaOptions(["  Zeta nueva ", "", "—"]);
    expect(options.some((option) => option.value === "Zeta nueva")).toBe(true);
    expect(options.some((option) => option.value === "—")).toBe(false);
    const labels = options.map((option) => option.label);
    expect([...labels].sort((a, b) => a.localeCompare(b, "es"))).toEqual(labels);
  });

  it("formatPrimarioLabel usa título (código) o código/sku", () => {
    const base = { idProducto: "1", categoria: "", proveedor: "", label: "" };
    expect(
      formatPrimarioLabel({ ...base, titulo: "Pollo", codigo: "C1", sku: "S1" }),
    ).toBe("Pollo (C1)");
    expect(
      formatPrimarioLabel({ ...base, titulo: "", codigo: "", sku: "S1" }),
    ).toBe("S1");
  });
});
