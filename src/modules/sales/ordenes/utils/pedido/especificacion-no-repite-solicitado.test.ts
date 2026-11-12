import { describe, expect, it } from "vitest";
import { resolveEspecificacionPedidoLinea } from "./resolve-especificacion-pedido-linea";

describe("no repetir en Especificación lo que ya dice Solicitado (REQ-287)", () => {
  it("Pimiento morrón ROJO · por kilo con el mismo Solicitado queda sin especificación", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: null,
        textoOriginal: "Pimiento morrón ROJO por kilo",
        especificacionOrigen: "Pimiento morrón ROJO · por kilo",
      }),
    ).toBe("");
  });

  it("Piña sin penacho deja sin penacho aunque también esté en Solicitado", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: null,
        textoOriginal: "Piña sin penacho",
        especificacionOrigen: "sin penacho",
      }),
    ).toBe("sin penacho");
  });

  it("los atributos pedidos se muestran siempre (limpio, en bote, fresco)", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: null,
        textoOriginal: "Ajo limpio por kilo en bote fresco",
        especificacionOrigen: "limpio, en bote, fresco",
      }),
    ).toBe("limpio · en bote · fresco");
  });
});
