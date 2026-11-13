import { describe, expect, it } from "vitest";
import {
  aliasPrincipalPorPar,
  mensajeFraseLarga,
  mensajePrecioInvalido,
  traducirErrorAlias,
} from "./comprador-alias-reglas";

describe("mensajes de validación", () => {
  it("arma la frase larga y el precio inválido con el código", () => {
    expect(mensajeFraseLarga("DICOK")).toBe(
      "La equivalencia de DICOK supera 255 caracteres.",
    );
    expect(mensajePrecioInvalido("DICOK")).toBe(
      "Ingresa un precio válido para DICOK.",
    );
  });
});

describe("traducirErrorAlias", () => {
  it("traduce una frase repetida", () => {
    expect(
      traducirErrorAlias(
        new Error(
          'duplicate key value violates unique constraint "uq_comprador_producto_alias_frase"',
        ),
      ),
    ).toBe("Este comprador ya usa esa frase para otro producto.");
  });

  it("traduce un precio especial repetido", () => {
    expect(
      traducirErrorAlias(
        new Error(
          'duplicate key value violates unique constraint "uq_comprador_producto_alias_precio"',
        ),
      ),
    ).toBe("Este comprador ya tiene un precio especial para ese producto.");
  });

  it("deja el aviso genérico en el unique viejo", () => {
    expect(
      traducirErrorAlias(
        new Error(
          'duplicate key value violates unique constraint "uq_comprador_producto_alias"',
        ),
      ),
    ).toBe("Este comprador ya tiene una equivalencia para ese producto.");
  });

  it("devuelve null si no es unique", () => {
    expect(traducirErrorAlias(new Error("column does not exist"))).toBeNull();
  });
});

describe("aliasPrincipalPorPar", () => {
  it("elige la fila con precio y, si no hay, la primera en orden", () => {
    const conPrecio = {
      idComprador: "c1",
      idProducto: "p1",
      equivalencia: "Patilla con precio",
      precioOverride: 55,
    };
    const primera = {
      idComprador: "c1",
      idProducto: "p1",
      equivalencia: "Patilla",
      precioOverride: null,
    };
    const segunda = {
      idComprador: "c1",
      idProducto: "p1",
      equivalencia: "Sandía",
      precioOverride: null,
    };
    const otro = {
      idComprador: "c1",
      idProducto: "p2",
      equivalencia: "Ajo",
      precioOverride: null,
    };

    const porPar = aliasPrincipalPorPar([primera, segunda, conPrecio, otro]);
    expect(porPar.get("c1::p1")).toEqual(conPrecio);
    expect(porPar.get("c1::p2")).toEqual(otro);

    const sinPrecio = aliasPrincipalPorPar([primera, segunda]);
    expect(sinPrecio.get("c1::p1")).toEqual(primera);
  });
});
