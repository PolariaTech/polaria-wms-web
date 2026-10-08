import { describe, expect, it } from "vitest";
import {
  collectOrdenesCompraCliente,
  countOrdenesTrabajo,
} from "./orden-venta-tabla-meta";

describe("collectOrdenesCompraCliente", () => {
  it("toma la OCC flat y las de cada OT sin duplicar", () => {
    expect(
      collectOrdenesCompraCliente({
        ordenCompraHotel: "OC-1, OC-2",
        origenCorreo: [
          {
            "Numero pedido": "OC-1",
            Almacen: "Cocina A",
            Producto: "Hass",
            Cantidad: 1,
          },
          {
            "Numero pedido": "OC-3",
            Almacen: "Cocina B",
            Producto: "Hass",
            Cantidad: 1,
          },
        ],
      }),
    ).toEqual(["OC-1", "OC-2", "OC-3"]);
  });

  it("devuelve vacío si no hay OCC", () => {
    expect(collectOrdenesCompraCliente({})).toEqual([]);
  });
});

describe("countOrdenesTrabajo", () => {
  it("cuenta hijas distintas por pedido+almacén", () => {
    expect(
      countOrdenesTrabajo([
        {
          "Numero pedido": "100",
          Almacen: "A",
          Producto: "Hass",
          Cantidad: 1,
        },
        {
          "Numero pedido": "200",
          Almacen: "B",
          Producto: "Hass",
          Cantidad: 1,
        },
      ]),
    ).toBe(2);
  });

  it("sin origen_correo cuenta 1", () => {
    expect(countOrdenesTrabajo(null)).toBe(1);
  });
});
