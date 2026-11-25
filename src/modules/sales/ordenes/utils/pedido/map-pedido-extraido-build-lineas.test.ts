import { describe, expect, it } from "vitest";
import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import { buildLineasVentaFromPedido } from "./map-pedido-extraido-build-lineas";

describe("map-pedido-extraido-build-lineas", () => {
  it("buildLineasVentaFromPedido está exportado", () => {
    expect(typeof buildLineasVentaFromPedido).toBe("function");
  });

  it("sin líneas devuelve arreglo vacío", () => {
    const pedido = { lineas: [] } as PedidoExtraido;
    expect(buildLineasVentaFromPedido({ pedido, productos: [] })).toEqual([]);
  });
});