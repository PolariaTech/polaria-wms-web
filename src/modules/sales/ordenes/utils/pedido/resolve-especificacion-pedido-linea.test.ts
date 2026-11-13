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

describe("resolveEspecificacionPedidoLinea con la especificación del origen (REQ-287)", () => {
  it("suma lo que Mateo leyó (sin penacho, limpio, en bote…)", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: null,
        textoOriginal: "Tomate verde",
        especificacionOrigen: "Limpio, por kilo, sin cáscara",
      }),
    ).toBe("Limpio · por kilo · sin cáscara");
  });

  it("no repite el envase que ya se calculó y conserva 'Fresco'", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: null,
        envaseTexto: "18x cubeta de 10 litros",
        textoOriginal: "Jugo de Naranja",
        especificacionOrigen: "Fresco, cubeta de 10 litros",
      }),
    ).toBe("18x cubeta de 10 litros · Fresco");
  });

  it("la madurez del origen sale con etiqueta y sin repetirse", () => {
    expect(
      resolveEspecificacionPedidoLinea({ especificacionIa: null, textoOriginal: "AGUACATE EXTRA", especificacionOrigen: "Amarillo" }),
    ).toBe("Madurez: Amarillo");
    expect(
      resolveEspecificacionPedidoLinea({ especificacionIa: "Madurez: Amarillo", textoOriginal: "AGUACATE EXTRA", especificacionOrigen: "Amarillo" }),
    ).toBe("Madurez: Amarillo");
  });

  it("el domo del origen se normaliza y no se duplica con el del nombre", () => {
    expect(
      resolveEspecificacionPedidoLinea({ especificacionIa: null, textoOriginal: "FRAMBUESAS (DOMO)", especificacionOrigen: "Domo de 500 g" }),
    ).toBe("Domo de 500g");
    expect(
      resolveEspecificacionPedidoLinea({ especificacionIa: null, textoOriginal: "FRAMBUESAS (DOMO) (Domo de 500 g)", especificacionOrigen: "Domo de 500 g" }),
    ).toBe("Domo de 500g");
  });

  it("la madurez de la columna no se pierde cuando hay otras partes", () => {
    expect(
      resolveEspecificacionPedidoLinea({
        especificacionIa: "Madurez: Rojo",
        envaseTexto: "2 PZA",
        textoOriginal: "PIÑA",
        especificacionOrigen: "aprox. 3.6 kg",
      }),
    ).toBe("2 PZA · Madurez: Rojo · aprox. 3.6 kg");
  });

  it("control: sin especificación de origen el resultado es el de siempre", () => {
    expect(resolveEspecificacionPedidoLinea({ especificacionIa: "Madurez: Rojo", textoOriginal: "PIÑA" })).toBe("Madurez: Rojo");
    expect(resolveEspecificacionPedidoLinea({ especificacionIa: null, envaseTexto: "1x galón de 5 litros" })).toBe("1x galón de 5 litros");
  });
});
