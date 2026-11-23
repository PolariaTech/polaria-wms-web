import { describe, expect, it } from "vitest";
import { coreProductNameForMatch, productNamesLooselyMatch } from "./producto-catalogo-names";

describe("producto-catalogo-names", () => {
  it("coreProductNameForMatch quita tallas", () => {
    expect(coreProductNameForMatch("AGUACATE EXTRA (200 a 260g)")).toBe("aguacate extra");
  });

  it("productNamesLooselyMatch tolera sinónimos", () => {
    expect(productNamesLooselyMatch("blue berry", "ARÁNDANOS/BLUEBERRIES")).toBe(true);
  });
});