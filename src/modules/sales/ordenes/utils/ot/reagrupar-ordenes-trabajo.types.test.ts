import { describe, expect, it } from "vitest";
import type { LineaReagrupable } from "./reagrupar-ordenes-trabajo.types";

describe("reagrupar-ordenes-trabajo.types", () => {
  it("LineaReagrupable admite campos mínimos", () => {
    const linea: LineaReagrupable = {
      nombre: "AGUACATE",
      codigo: "COD-AGU",
      cantidadInput: "10",
    };
    expect(linea.cantidadInput).toBe("10");
  });
});