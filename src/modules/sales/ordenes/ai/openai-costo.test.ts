import { describe, expect, it } from "vitest";
import { calcularCostoUSD } from "./openai-costo";

describe("calcularCostoUSD", () => {
  it("devuelve null si el modelo no tiene precio conocido", () => {
    expect(calcularCostoUSD("modelo-inventado", 100, 0, 0, 10)).toBeNull();
  });
});
