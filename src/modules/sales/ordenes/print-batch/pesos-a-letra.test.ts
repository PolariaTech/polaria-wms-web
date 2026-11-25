import { describe, expect, it } from "vitest";
import { pesosALetra } from "./pesos-a-letra";

describe("pesosALetra", () => {
  it("escribe el total de la factura de muestra", () => {
    expect(pesosALetra(69)).toBe("sesenta y nueve Pesos 00/100 M.N.");
  });

  it("usa el singular y los centavos", () => {
    expect(pesosALetra(1)).toBe("un Peso 00/100 M.N.");
    expect(pesosALetra(21.5)).toBe("veintiuno Pesos 50/100 M.N.");
  });
});
