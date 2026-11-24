import { describe, expect, it } from "vitest";
import {
  buildTextoOrigenPedido,
  parseOrigenPedidoBlocks,
} from "./texto-origen-pedido-contenido";

describe("texto-origen-pedido-contenido", () => {
  it("parsea bloques y prioriza texto pegado", () => {
    expect(parseOrigenPedidoBlocks("[[texto]]\nNota")[0]).toEqual({
      type: "text",
      text: "Nota",
    });
    expect(buildTextoOrigenPedido("manual", [])).toBe("manual");
  });
});