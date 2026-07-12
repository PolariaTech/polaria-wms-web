import { describe, expect, it } from "vitest";
import { mapOrdenVentaOperadorApiRow } from "./orden-venta-api.mapper";

describe("orden-venta-api.mapper", () => {
  it("mapea fila camelCase del API Nest", () => {
    expect(
      mapOrdenVentaOperadorApiRow({
        idOrdenVenta: "ov-1",
        venta: "OV-001",
        codigoCuenta: "ACME",
        comprador: "Retail Norte",
        productos: "2 productos",
        cantidadKg: 15,
        total: 2000,
        estado: "en_preparacion",
        fechaPedido: "2026-07-09",
        destino: "Bodega Sur",
      }),
    ).toEqual({
      idOrdenVenta: "ov-1",
      venta: "OV-001",
      cuenta: "ACME",
      comprador: "Retail Norte",
      productos: "2 productos",
      cantidadKg: 15,
      total: 2000,
      estado: "en_preparacion",
      fecha: "2026-07-09",
      destino: "Bodega Sur",
    });
  });
});
