import { describe, expect, it } from "vitest";
import {
  scoreLineaOrigenVsRenglon,
  sellarIdProductoEnRenglonesOrigen,
} from "./sellar-id-producto-origen";

describe("sellarIdProductoEnRenglonesOrigen (REQ-236)", () => {
  it("sella _idProducto cuando el form tiene la línea verificada sin otId útil", () => {
    const filas = sellarIdProductoEnRenglonesOrigen({
      renglones: [
        { Producto: "Aguacate Hass", "Codigo producto": "100", Cantidad: 1 },
        { Producto: "Tomate", Cantidad: 2 },
      ],
      lineasVerificadas: [
        {
          nombre: "Aguacate Hass",
          codigo: "100",
          cantidad: 1,
          unidadMedida: "KGM",
          precioUnitario: 5,
          idProducto: "prod-aguacate",
          aliasCliente: "Aguacate Hass",
        },
      ],
    });
    expect(filas[0]?._idProducto).toBe("prod-aguacate");
    expect(filas[1]?._idProducto).toBeUndefined();
  });

  it("no pisa un _idProducto ya guardado", () => {
    const filas = sellarIdProductoEnRenglonesOrigen({
      renglones: [
        {
          Producto: "Aguacate",
          Cantidad: 1,
          _idProducto: "ya-guardado",
        },
      ],
      lineasVerificadas: [
        {
          nombre: "Aguacate",
          codigo: "100",
          cantidad: 1,
          unidadMedida: "KGM",
          precioUnitario: 5,
          idProducto: "otro",
        },
      ],
    });
    expect(filas[0]?._idProducto).toBe("ya-guardado");
  });
});

describe("scoreLineaOrigenVsRenglon (REQ-236)", () => {
  it("puntúa más el match exacto de nombre", () => {
    const alta = scoreLineaOrigenVsRenglon(
      {
        nombre: "Tomate saladette",
        codigo: "200",
        cantidad: 1,
        unidadMedida: "KGM",
        precioUnitario: 1,
        idProducto: "p1",
      },
      { Producto: "Tomate saladette", Cantidad: 1 },
    );
    const baja = scoreLineaOrigenVsRenglon(
      {
        nombre: "Pepino",
        codigo: "300",
        cantidad: 1,
        unidadMedida: "KGM",
        precioUnitario: 1,
        idProducto: "p2",
      },
      { Producto: "Tomate saladette", Cantidad: 1 },
    );
    expect(alta).toBeGreaterThan(baja);
  });
});
