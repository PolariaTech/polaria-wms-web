import { describe, expect, it } from "vitest";
import { getOrdenVentaDetalle } from "./sales-orden-venta-detalle.service";

describe("sales-orden-venta-detalle.service", () => {
  it("getOrdenVentaDetalle rechaza id vacío", async () => {
    await expect(
      getOrdenVentaDetalle({ codigoCuenta: "CTA", idOrdenVenta: "  " }),
    ).rejects.toMatchObject({ message: "La orden de venta no es válida." });
  });
});
