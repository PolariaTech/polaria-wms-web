import { describe, expect, it } from "vitest";
import {
  getCuentaIdBodegaDefault,
  listProductosVentaCatalogo,
} from "./sales-catalogo-venta.service";

describe("sales-catalogo-venta.service", () => {
  it("exporta la API pública de catálogo", () => {
    expect(typeof getCuentaIdBodegaDefault).toBe("function");
    expect(typeof listProductosVentaCatalogo).toBe("function");
  });

  it("rechaza cuenta vacía", async () => {
    await expect(listProductosVentaCatalogo("  ")).rejects.toBeDefined();
  });
});
