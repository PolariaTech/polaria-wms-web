import { describe, expect, it } from "vitest";
import { preciosYEquivalenciasDeComprador } from "./useClienteOv";

describe("preciosYEquivalenciasDeComprador", () => {
  it("el precio del alias reemplaza el último precio", () => {
    const { overrides, equivalencias } = preciosYEquivalenciasDeComprador(
      [{ idProducto: "p1", precioOverride: 12, alias: "Palta" }],
      { p1: 40, p2: 5 },
    );
    expect(overrides).toEqual({ p1: 12, p2: 5 });
    expect(equivalencias).toEqual({ p1: "Palta" });
  });
});
