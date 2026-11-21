import { describe, expect, it } from "vitest";
import {
  fraseUnidadPedidoDiscrepante,
  resolveUnidadPedidoLinea,
} from "./resolve-unidad-pedido-linea";

describe("resolveUnidadPedidoLinea (REQ-380)", () => {
  it("con catálogo, usa la unidad del SKU aunque el texto diga kg", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: "PZA",
        unidadCatalogo: "PZA",
        textoProducto: "Coliflor Blanca 20.00 KG Sin Oxidacion",
      }),
    ).toBe("PZA");
  });

  it("con catálogo PZA, ignora KGM del origen", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: "KG",
        unidadCatalogo: "PZA",
        textoProducto: "Coliflor Blanca (Sin Oxidacion)",
      }),
    ).toBe("PZA");
  });

  it("si no hay señal de pedido, respeta el catálogo", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: "",
        unidadCatalogo: "PZA",
        textoProducto: "Coliflor Blanca (Sin Oxidacion)",
      }),
    ).toBe("PZA");
  });

  it("con catálogo KGM, no deja que litros del texto pisen la unidad", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: null,
        unidadCatalogo: "KGM",
        textoProducto: "Jugo de limón 5 litros",
      }),
    ).toBe("KGM");
  });

  it("si la OC pide piezas y el catálogo es KGM, usa KGM", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: "PZA",
        unidadCatalogo: "KGM",
        textoProducto: "Coliflor Blanca (Sin Oxidacion)",
      }),
    ).toBe("KGM");
  });

  it("galón UN + texto litros + catálogo LTR → LTR (string del catálogo)", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: "UN",
        unidadCatalogo: "LTR",
        textoProducto: "Jugo de Limón fresco galón de 5 litros",
      }),
    ).toBe("LTR");
  });

  it("sin catálogo, usa la unidad del origen", () => {
    expect(
      resolveUnidadPedidoLinea({
        unidadOrigen: "PZA",
        unidadCatalogo: "",
        textoProducto: "Plátano macho",
      }),
    ).toBe("PZA");
  });
});

describe("fraseUnidadPedidoDiscrepante (REQ-380)", () => {
  it("cuando el pedido pide PZA y el catálogo es KGM, anota Pedido en PZA", () => {
    expect(
      fraseUnidadPedidoDiscrepante({
        unidadOrigen: "PZ",
        unidadCatalogo: "KGM",
        textoProducto: "Plátano macho",
      }),
    ).toBe("Pedido en PZA");
  });

  it("misma familia no genera frase", () => {
    expect(
      fraseUnidadPedidoDiscrepante({
        unidadOrigen: "KG",
        unidadCatalogo: "KGM",
        textoProducto: "Jitomate",
      }),
    ).toBe("");
  });

  it("sin catálogo no genera frase", () => {
    expect(
      fraseUnidadPedidoDiscrepante({
        unidadOrigen: "PZA",
        unidadCatalogo: "",
        textoProducto: "Plátano macho",
      }),
    ).toBe("");
  });
});
