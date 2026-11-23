import { describe, expect, it } from "vitest";
import { mapStockRowToProductoOption } from "./sales-stock-venta";
import type { StockVentaProductoAgg } from "./sales-orden-venta.db";

describe("sales-stock-venta", () => {
  it("mapStockRowToProductoOption arma la opción con código y unidad por defecto", () => {
    const stock = {
      kgDisponible: 12,
      sampleRow: {
        id_producto: "abcdefgh-1",
        id_bodega: "b1",
        id_ubicacion: "u1",
        cantidad: 12,
        cantidad_reservada: 0,
        producto: {
          id_producto: "abcdefgh-1",
          sku: "SKU1",
          descripcion: "Salmón",
          id_cliente: "c1",
        },
      },
    } as unknown as StockVentaProductoAgg;

    const option = mapStockRowToProductoOption("abcdefgh-1", stock, 5, " ");
    expect(option.codigo).toBe("SKU1");
    expect(option.idBodega).toBe("b1");
    expect(option.idCliente).toBe("c1");
    expect(option.kgDisponible).toBe(12);
    expect(option.precioUnitario).toBe(5);
    expect(option.unidadMedida.length).toBeGreaterThan(0);
  });
});
