import { describe, expect, it } from "vitest";

describe("comprador-precios-excel.workbook smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-precios-excel.workbook");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
