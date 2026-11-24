import { describe, expect, it } from "vitest";
import {
  buildPrimarioHaystack,
  matchesSearch,
  normalizeSearch,
  uniqueSorted,
} from "./catalogo-primario-picker.utils";

describe("catalogo-primario-picker.utils", () => {
  it("normalizeSearch quita acentos y mayúsculas", () => {
    expect(normalizeSearch("  ÁRBOL Café ")).toBe("arbol cafe");
  });

  it("matchesSearch exige todos los tokens", () => {
    expect(matchesSearch("Pollo entero SKU1", "pollo sku1")).toBe(true);
    expect(matchesSearch("Pollo entero", "pollo cerdo")).toBe(false);
    expect(matchesSearch("Pollo", "   ")).toBe(true);
  });

  it("buildPrimarioHaystack concatena los campos buscables", () => {
    expect(
      buildPrimarioHaystack({
        idProducto: "1",
        titulo: "Pollo",
        codigo: "C1",
        sku: "S1",
        categoria: "Aves",
        proveedor: "Prov",
        label: "Pollo (S1)",
      }),
    ).toBe("Pollo C1 S1 Aves Prov Pollo (S1)");
  });

  it("uniqueSorted deduplica, descarta vacíos y ordena", () => {
    expect(uniqueSorted(["b", "", "a", "b"])).toEqual([
      { value: "a", label: "a" },
      { value: "b", label: "b" },
    ]);
  });
});
