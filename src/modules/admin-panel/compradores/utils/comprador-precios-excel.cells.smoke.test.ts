import { describe, expect, it } from "vitest";

describe("comprador-precios-excel.cells smoke", () => {
  it("expone buildCompradorPreciosSheetData", async () => {
    const mod = await import("./comprador-precios-excel.cells");
    expect(typeof mod.buildCompradorPreciosSheetData).toBe("function");
  });
});