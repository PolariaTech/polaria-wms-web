import { describe, expect, it } from "vitest";
import { codigoCoincideEnQuery } from "./codigo-coincide-en-query";

describe("codigo-coincide-en-query", () => {
  it("no confunde SKU corto con medidas", () => {
    expect(
      codigoCoincideEnQuery("Jugo de Limón fresco galón de 5 litros", "5"),
    ).toBe(false);
    expect(codigoCoincideEnQuery("pedido codigo 5 listo", "5")).toBe(true);
  });
});