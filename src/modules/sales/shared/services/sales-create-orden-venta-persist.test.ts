import { describe, expect, it } from "vitest";
import {
  buildLineasResumenCreate,
  insertLineasOrdenVenta,
} from "./sales-create-orden-venta-persist";

describe("sales-create-orden-venta-persist", () => {
  it("buildLineasResumenCreate suma kg y total con precio de catálogo o explícito", () => {
    const resumen = buildLineasResumenCreate(
      [
        { idProducto: "p1", cantidadPedida: 2 },
        { idProducto: "p2", cantidadPedida: 3, precioUnitario: 10 },
      ],
      new Map([["p1", 5]]),
    );

    expect(resumen).toEqual({ count: 2, cantidadKg: 5, total: 40 });
  });

  it("insertLineasOrdenVenta no hace nada sin líneas", async () => {
    await expect(
      insertLineasOrdenVenta("ov1", [], new Map()),
    ).resolves.toBeUndefined();
  });
});
