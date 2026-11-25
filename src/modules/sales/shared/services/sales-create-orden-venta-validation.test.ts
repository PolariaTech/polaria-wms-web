import { describe, expect, it } from "vitest";
import {
  resolveCompradorParaCreate,
  validateLineasCreateOrdenVenta,
} from "./sales-create-orden-venta-validation";

describe("sales-create-orden-venta-validation", () => {
  it("acepta líneas válidas", () => {
    expect(() =>
      validateLineasCreateOrdenVenta(
        [{ idProducto: "p1", cantidadPedida: 2, precioUnitario: 1 }],
        false,
      ),
    ).not.toThrow();
  });

  it("rechaza producto vacío, cantidad negativa y cantidad cero al confirmar", () => {
    expect(() =>
      validateLineasCreateOrdenVenta([{ idProducto: " ", cantidadPedida: 1 }], false),
    ).toThrow("Cada línea debe tener un producto del catálogo.");
    expect(() =>
      validateLineasCreateOrdenVenta([{ idProducto: "p", cantidadPedida: -1 }], true),
    ).toThrow("La cantidad de cada producto no puede ser negativa.");
    expect(() =>
      validateLineasCreateOrdenVenta([{ idProducto: "p", cantidadPedida: 0 }], false),
    ).toThrow("La cantidad de cada producto debe ser mayor a cero.");
    expect(() =>
      validateLineasCreateOrdenVenta(
        [{ idProducto: "p", cantidadPedida: 1, precioUnitario: -1 }],
        true,
      ),
    ).toThrow("El precio de cada producto no puede ser negativo.");
  });

  it("resolveCompradorParaCreate exige comprador sin avance", async () => {
    await expect(
      resolveCompradorParaCreate({
        idComprador: "",
        codigoCuenta: "CTA",
        guardarAvance: false,
        idOrdenVentaExistente: "",
        origenOnlyFirstDraft: false,
      }),
    ).rejects.toMatchObject({ message: "Selecciona un comprador." });
  });

  it("resolveCompradorParaCreate devuelve el comprador informado", async () => {
    await expect(
      resolveCompradorParaCreate({
        idComprador: "c1",
        codigoCuenta: "CTA",
        guardarAvance: false,
        idOrdenVentaExistente: "",
        origenOnlyFirstDraft: false,
      }),
    ).resolves.toBe("c1");
  });
});
