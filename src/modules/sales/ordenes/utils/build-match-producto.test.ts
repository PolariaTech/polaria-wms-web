import { describe, expect, it } from "vitest";
import { buildMatchProductoLinea } from "./build-match-producto";

describe("buildMatchProductoLinea", () => {
  it("arma textoCliente, sugeridoMateo y elegidoUsuario", () => {
    const match = buildMatchProductoLinea({
      textoCliente: "AGUACATE JASS",
      sugeridoMateo: {
        idProducto: "sug-1",
        nombre: "Aguacate Hass Extra",
        codigo: "SKU-E",
      },
      elegidoUsuario: {
        idProducto: "prod-2",
        nombre: "Aguacate Hass Primera",
        codigo: "SKU-P",
      },
    });

    expect(match).toEqual({
      textoCliente: "AGUACATE JASS",
      sugeridoMateo: {
        idProducto: "sug-1",
        nombre: "Aguacate Hass Extra",
        codigo: "SKU-E",
      },
      elegidoUsuario: {
        idProducto: "prod-2",
        nombre: "Aguacate Hass Primera",
        codigo: "SKU-P",
      },
    });
  });

  it("devuelve null sin producto elegido", () => {
    expect(
      buildMatchProductoLinea({
        textoCliente: "X",
        elegidoUsuario: { idProducto: "  " },
      }),
    ).toBeNull();
  });

  it("permite sugeridoMateo null", () => {
    const match = buildMatchProductoLinea({
      textoCliente: "PIÑA",
      sugeridoMateo: null,
      elegidoUsuario: {
        idProducto: "p1",
        nombre: "Piña",
        codigo: "PIN",
      },
    });
    expect(match?.sugeridoMateo).toBeNull();
    expect(match?.textoCliente).toBe("PIÑA");
  });
});
