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

  it("lee el formato del correo del aplicativo: «4 pza (aprox. 7.2 kg)» (REQ-231)", () => {
    expect(
      parsePiezasAproxKg(
        "3. PIÑA [Cód. 105001508] · 4 pza (aprox. 7.2 kg) · $26.00/kg · Madurez: Amarillo · $187.20 aprox.",
      ),
    ).toEqual({ piezas: 4, kg: 7.2, especificacion: "4 PZA" });
    expect(parsePiezasAproxKg("2 pza (aprox. 3 kg)")?.kg).toBe(3);
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

  it("encuentra la pieza en la línea numerada del correo del aplicativo (REQ-231)", () => {
    const parsed = piezasAproxKgParaLinea({
      producto: "PIÑA",
      textoFuente: [
        "1. AGUACATE PRIMERA (170 a 200g) [Cód. 115001009] · 10 kg · $45.00/kg",
        "3. PIÑA [Cód. 105001508] · 4 pza (aprox. 7.2 kg) · $26.00/kg · $187.20 aprox.",
      ].join("\n"),
    });
    expect(parsed).toEqual({ piezas: 4, kg: 7.2, especificacion: "4 PZA" });
  });

  it("no toca los productos que se piden y se cobran por pieza", () => {
    expect(parsePiezasAproxKg("13. ELOTE [Cód. 105001552] · 4 pza · $17.00/pza · $68.00")).toBeNull();
  });
});
