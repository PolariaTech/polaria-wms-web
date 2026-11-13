import { describe, expect, it } from "vitest";
import { equivalenciasPorAprender } from "./aprender-equivalencias";

const lineaBase = {
  idProducto: "p-elegido",
  aliasCliente: "Manzana verde",
  nombre: "MANZANA RED",
};

describe("equivalenciasPorAprender", () => {
  it("una línea aceptada sin cambios no aprende", () => {
    expect(
      equivalenciasPorAprender({
        lineas: [
          {
            ...lineaBase,
            idProducto: "p-granny",
            propuestaSistema: {
              producto: { idProducto: "p-granny" },
            },
          },
        ],
        idComprador: "c1",
        idsProductoVenta: ["p-granny"],
      }),
    ).toEqual([]);
  });

  it("una línea corregida aprende", () => {
    expect(
      equivalenciasPorAprender({
        lineas: [
          {
            ...lineaBase,
            propuestaSistema: {
              producto: { idProducto: "p-granny" },
            },
          },
        ],
        idComprador: "c1",
        idsProductoVenta: ["p-elegido"],
      }),
    ).toEqual([{ frase: "Manzana verde", idProducto: "p-elegido" }]);
  });

  it("una línea pendiente resuelta aprende", () => {
    expect(
      equivalenciasPorAprender({
        lineas: [
          {
            ...lineaBase,
            propuestaSistema: { producto: null },
          },
        ],
        idComprador: "c1",
        idsProductoVenta: ["p-elegido"],
      }),
    ).toEqual([{ frase: "Manzana verde", idProducto: "p-elegido" }]);
  });

  it("sin comprador, con frase vacía o fuera de la venta, no aprende", () => {
    const pendiente = {
      ...lineaBase,
      propuestaSistema: { producto: null as null },
    };
    expect(
      equivalenciasPorAprender({
        lineas: [pendiente],
        idComprador: "",
        idsProductoVenta: ["p-elegido"],
      }),
    ).toEqual([]);
    expect(
      equivalenciasPorAprender({
        lineas: [{ ...pendiente, aliasCliente: "   ", nombre: "" }],
        idComprador: "c1",
        idsProductoVenta: ["p-elegido"],
      }),
    ).toEqual([]);
    expect(
      equivalenciasPorAprender({
        lineas: [pendiente],
        idComprador: "c1",
        idsProductoVenta: ["otro"],
      }),
    ).toEqual([]);
  });

  it("una frase en conflicto dentro de la OV no aprende", () => {
    expect(
      equivalenciasPorAprender({
        lineas: [
          {
            ...lineaBase,
            idProducto: "p-1",
            propuestaSistema: { producto: null },
          },
          {
            ...lineaBase,
            idProducto: "p-2",
            propuestaSistema: { producto: null },
          },
        ],
        idComprador: "c1",
        idsProductoVenta: ["p-1", "p-2"],
      }),
    ).toEqual([]);
  });

  it("una línea agregada a mano no aprende", () => {
    expect(
      equivalenciasPorAprender({
        lineas: [{ ...lineaBase }],
        idComprador: "c1",
        idsProductoVenta: ["p-elegido"],
      }),
    ).toEqual([]);
  });
});
