import { describe, expect, it } from "vitest";

describe("comprador-precios-excel.rows smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-precios-excel.rows");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
