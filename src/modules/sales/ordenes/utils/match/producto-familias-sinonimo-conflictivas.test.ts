import { describe, expect, it } from "vitest";
import { productosFamiliasSinonimoConflictivas } from "./producto-familias-sinonimo-conflictivas";

describe("producto-familias-sinonimo-conflictivas", () => {
  it("marca conflicto cebolla vs aguacate", () => {
    expect(
      productosFamiliasSinonimoConflictivas("cebolla morada", {
        nombre: "Aguacate Hass",
        codigo: "AVO",
      }),
    ).toBe(true);
    expect(
      productosFamiliasSinonimoConflictivas("aguacate hass", {
        nombre: "Aguacate Extra",
        codigo: "AVO",
      }),
    ).toBe(false);
  });
});