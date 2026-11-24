import { describe, expect, it } from "vitest";
import { parseCantidadRenglon, sanitizarEtiqueta } from "./reagrupar-ordenes-trabajo.helpers";

describe("reagrupar-ordenes-trabajo.helpers", () => {
  it("parseCantidadRenglon acepta coma decimal", () => {
    expect(parseCantidadRenglon("12,5")).toBe(12.5);
  });

  it("sanitizarEtiqueta recorta y limpia", () => {
    expect(sanitizarEtiqueta("  Cocina <b>principal</b>  ")).toBe("Cocina principal");
  });
});