import { describe, expect, it } from "vitest";
import { PRODUCTOS_POR_HOJA_TAREA } from "./map-orden-tarea-almacen";

describe("PRODUCTOS_POR_HOJA_TAREA (REQ-269)", () => {
  it("queda en 20 productos por hoja de impresión", () => {
    expect(PRODUCTOS_POR_HOJA_TAREA).toBe(20);
  });
});
