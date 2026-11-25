import { describe, expect, it } from "vitest";
import {
  createOrdenVenta,
  updateOrdenVenta,
} from "./sales-create-orden-venta.service";

describe("sales-create-orden-venta.service", () => {
  it("createOrdenVenta exige comprador sin avance", async () => {
    await expect(
      createOrdenVenta({ codigoCuenta: "CTA", lineas: [] }),
    ).rejects.toMatchObject({ message: "Selecciona un comprador." });
  });

  it("updateOrdenVenta rechaza id vacío", async () => {
    await expect(
      updateOrdenVenta({
        codigoCuenta: "CTA",
        idOrdenVenta: " ",
        lineas: [],
      }),
    ).rejects.toMatchObject({ message: "La orden de venta no es válida." });
  });
});
