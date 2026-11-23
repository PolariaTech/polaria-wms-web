import { describe, expect, it } from "vitest";
import { resolveBodegaVenta } from "./sales-validacion-venta";

describe("sales-validacion-venta", () => {
  it("resolveBodegaVenta devuelve la bodega preferida sin consultar", async () => {
    await expect(resolveBodegaVenta("CTA", "  bod-1 ")).resolves.toBe("bod-1");
  });
});
