import { describe, expect, it } from "vitest";
import {
  esLineaExtraidaPedible,
  esRenglonOrigenPedible,
  filtrarLineasExtraidasPedibles,
  filtrarRenglonesOrigenPedibles,
} from "./renglon-origen-pedible";

describe("esRenglonOrigenPedible (REQ-234)", () => {
  it("omite SKU con cantidad 0", () => {
    expect(
      esRenglonOrigenPedible({
        Producto: "Aguacate",
        "Codigo producto": "100",
        Cantidad: 0,
      }),
    ).toBe(false);
  });

  it("conserva SKU con cantidad > 0", () => {
    expect(
      esRenglonOrigenPedible({ Producto: "Tomate", Cantidad: 2 }),
    ).toBe(true);
  });

  it("conserva placeholder de OT sin producto", () => {
    expect(
      esRenglonOrigenPedible({ Producto: "", Cantidad: 0 }),
    ).toBe(true);
  });
});

describe("filtrarLineasExtraidasPedibles (REQ-234)", () => {
  it("deja solo líneas pedibles", () => {
    const out = filtrarLineasExtraidasPedibles([
      { textoOriginal: "Aguacate", cantidad: 0 },
      { textoOriginal: "Tomate", cantidad: 3 },
      { textoOriginal: "Limón", cantidad: null },
    ]);
    expect(out.map((l) => l.textoOriginal)).toEqual(["Tomate", "Limón"]);
  });
});

describe("filtrarRenglonesOrigenPedibles (REQ-234)", () => {
  it("filtra el Excel con filas en cero", () => {
    const out = filtrarRenglonesOrigenPedibles([
      { Producto: "SKU A", Cantidad: 0 },
      { Producto: "SKU B", Cantidad: "1,5" },
      { Producto: "", "Codigo producto": "", Cantidad: 0 },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]?.Producto).toBe("SKU B");
  });
});

describe("esLineaExtraidaPedible", () => {
  it("descarta línea vacía", () => {
    expect(esLineaExtraidaPedible({ textoOriginal: "", cantidad: 1 })).toBe(
      false,
    );
  });
});
