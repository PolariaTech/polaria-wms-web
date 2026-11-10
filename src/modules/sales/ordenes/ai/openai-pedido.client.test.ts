import { describe, expect, it } from "vitest";
import { calcularCostoUSD } from "./openai-pedido.client";

describe("openai-pedido.client (reexports)", () => {
  it("sigue exportando calcularCostoUSD", () => {
    expect(calcularCostoUSD("modelo-inventado", 1, 0, 0, 1)).toBeNull();
  });
});
