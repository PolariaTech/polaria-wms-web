import { describe, expect, it } from "vitest";
import { resolveUnidadPedidoLinea } from "./resolve-unidad-pedido-linea";

describe("resolveUnidadPedidoLinea (REQ-363)", () => {
  it("si el texto del pedido dice kg y el catálogo es PZA, usa KGM", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: "PZA",
        unidadCatalogo: "PZA",
        textoProducto: "Coliflor Blanca 20.00 KG Sin Oxidacion",
      }),
    ).toBe("KGM");
  });

  it("si origen trae KGM y catálogo PZA, usa KGM", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: "KG",
        unidadCatalogo: "PZA",
        textoProducto: "Coliflor Blanca (Sin Oxidacion)",
      }),
    ).toBe("KGM");
  });

  it("si no hay señal de kg/litro, respeta el catálogo", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: "",
        unidadCatalogo: "PZA",
        textoProducto: "Coliflor Blanca (Sin Oxidacion)",
      }),
    ).toBe("PZA");
  });

  it("litros del pedido ganan sobre KGM de catálogo", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: null,
        unidadCatalogo: "KGM",
        textoProducto: "Jugo de limón 5 litros",
      }),
    ).toBe("LTR");
  });

  it("si la OC pide piezas y el catálogo es KGM, usa PZA", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: "PZA",
        unidadCatalogo: "KGM",
        textoProducto: "Coliflor Blanca (Sin Oxidacion)",
      }),
    ).toBe("PZA");
  });

  it("galón UN + texto litros + catálogo LTR → LTR (no PZA)", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: "UN",
        unidadCatalogo: "LTR",
        textoProducto: "Jugo de Limón fresco galón de 5 litros",
      }),
    ).toBe("LTR");
  });
});
