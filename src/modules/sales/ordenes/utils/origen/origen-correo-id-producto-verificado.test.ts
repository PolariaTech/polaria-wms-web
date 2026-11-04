import { describe, expect, it } from "vitest";
import { indexIdProductoVerificadoOrigen } from "./origen-correo-id-producto-verificado";

describe("indexIdProductoVerificadoOrigen", () => {
  it("ignora renglones sin _idProducto", () => {
    expect(
      indexIdProductoVerificadoOrigen([{ Producto: "x", _otId: "ot-1" }]).size,
    ).toBe(0);
  });
});
