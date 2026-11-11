import { describe, expect, it } from "vitest";
import { resolveEspecificacionPedidoLinea } from "./resolve-especificacion-pedido-linea";

describe("resolveEspecificacionPedidoLinea (REQ-287)", () => {
  it("pone Madurez: completa y Domo de 500g desde el texto del producto", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: null,
        textoOriginal: "AGUACATE EXTRA · Madurez: Amarillo",
      }),
    ).toBe("Madurez: Amarillo");

    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: null,
        textoOriginal: "FRAMBUESAS (DOMO) (Domo de 500 g)",
      }),
    ).toBe("Domo de 500g");
  });

  it("no duplica madurez si la IA ya la trajo", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: "Madurez: Amarillo · Firme",
        textoOriginal: "AGUACATE EXTRA madurez: amarillo",
      }),
    ).toBe("Madurez: Amarillo · Firme");
  });
});
