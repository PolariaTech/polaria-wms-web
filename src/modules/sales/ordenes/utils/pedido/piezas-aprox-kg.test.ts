import { describe, expect, it } from "vitest";
import {
  aplicarPiezasAproxKg,
  parsePiezasAproxKg,
  piezasAproxKgParaLinea,
} from "./piezas-aprox-kg";

describe("parsePiezasAproxKg", () => {
  it("separa 3 piezas y 5.4 kg", () => {
    expect(parsePiezasAproxKg("3 piezas, aprox 5.4 KG")).toEqual({
      piezas: 3,
      kg: 5.4,
      especificacion: "3 PZA",
    });
  });

  it("acepta pza, coma decimal y aprox.", () => {
    expect(parsePiezasAproxKg("3 pza aprox. 5,4 kg")?.especificacion).toBe(
      "3 PZA",
    );
    expect(parsePiezasAproxKg("3 pza aprox. 5,4 kg")?.kg).toBe(5.4);
  });

  it("no trata un envase de piezas como peso aproximado", () => {
    expect(parsePiezasAproxKg("3 piezas de 5 kg")).toBeNull();
  });
});

describe("aplicarPiezasAproxKg", () => {
  it("pone el peso en la cantidad y las piezas en la especificación", () => {
    const [linea] = aplicarPiezasAproxKg(
      [
        {
          textoOriginal: "Aguacate Hass 3 piezas, aprox 5.4 KG",
          cantidad: 3,
          especificacion: "Pintón",
          unidad: "UN",
        },
      ],
      null,
    );

    expect(linea?.cantidad).toBe(5.4);
    expect(linea?.unidad).toBe("KGM");
    expect(linea?.especificacion).toBe("Pintón · 3 PZA");
  });

  it("toma la frase de la línea del correo que nombra el producto", () => {
    const parsed = piezasAproxKgParaLinea({
      producto: "Aguacate Hass",
      textoFuente: [
        "Jitomate 2 piezas, aprox 1.2 KG",
        "Aguacate Hass 3 piezas, aprox 5.4 KG",
      ].join("\n"),
    });
    expect(parsed?.kg).toBe(5.4);
    expect(parsed?.especificacion).toBe("3 PZA");
  });
});
