import { describe, expect, it } from "vitest";
import { colorClienteDesambiguaSugerencia } from "./color-desambigua-auto-accept";

describe("colorClienteDesambiguaSugerencia (REQ-311)", () => {
  it("acepta chile verde cuando el query pide verde", () => {
    expect(
      colorClienteDesambiguaSugerencia({
        query: "Pimiento verde",
        sugerenciaNombre: "CHILE MORRON VERDE",
        topScore: 0.72,
        secondScore: 0.65,
      }),
    ).toBe(true);
  });

  it("rechaza si el top no trae el color pedido", () => {
    expect(
      colorClienteDesambiguaSugerencia({
        query: "Pimiento verde",
        sugerenciaNombre: "CHILE MORRON AMARILLO",
        topScore: 0.7,
        secondScore: 0.68,
      }),
    ).toBe(false);
  });
});
