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

  it("si la IA copia el Solicitado y todo se filtra, el resultado es vacío (no se cae a ia)", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: "Pimiento morrón ROJO · por kilo",
        textoOriginal: "Pimiento morrón ROJO por kilo",
      }),
    ).toBe("");
  });

  it("conserva cantidad y unidad que no están en Solicitado (3 pzas de pepino verde)", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: "3 pzas de pepino verde",
        textoOriginal: "PEPINO VERDE",
      }),
    ).toBe("3 pzas de pepino verde");
  });

  it("Solicitado idéntico a la especificación, con cantidad y unidad, queda vacío", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: "Tomate bola 5 kg",
        textoOriginal: "Tomate bola 5 kg",
      }),
    ).toBe("");
  });

  it("un envase que también está en Solicitado se sigue mostrando", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: null,
        textoOriginal: "Aceite caja de 10 litros",
        envaseTexto: "caja de 10 litros",
      }),
    ).toBe("caja de 10 litros");
  });
});
