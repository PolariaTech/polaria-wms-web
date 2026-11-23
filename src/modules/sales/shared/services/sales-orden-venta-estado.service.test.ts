import { describe, expect, it } from "vitest";
import {
  avanzarEstadoOrdenVenta,
  borrarOrdenVenta,
} from "./sales-orden-venta-estado.service";

describe("sales-orden-venta-estado.service", () => {
  it("borrarOrdenVenta rechaza id vacío", async () => {
    await expect(
      borrarOrdenVenta({ codigoCuenta: "CTA", idOrdenVenta: "  " }),
    ).rejects.toMatchObject({ message: "La orden de venta no es válida." });
  });

  it("avanzarEstadoOrdenVenta rechaza id vacío", async () => {
    await expect(
      avanzarEstadoOrdenVenta({
        codigoCuenta: "CTA",
        idOrdenVenta: " ",
        estado: "confirmada",
      }),
    ).rejects.toMatchObject({ message: "La orden de venta no es válida." });
  });
});
