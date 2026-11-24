import { describe, expect, it } from "vitest";
import { PRODUCTOS_POR_HOJA_TAREA, mapOrdenVentaToAlmacenPrintData } from "./map-orden-tarea-almacen";

describe("map-orden-tarea-almacen (barrel)", () => {
  it("reexporta PRODUCTOS_POR_HOJA_TAREA", () => {
    expect(PRODUCTOS_POR_HOJA_TAREA).toBe(30);
  });

  it("expone mapOrdenVentaToAlmacenPrintData", () => {
    expect(mapOrdenVentaToAlmacenPrintData).toBeTypeOf("function");
  });
});