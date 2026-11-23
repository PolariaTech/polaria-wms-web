import { describe, expect, it } from "vitest";

describe("comprador-precios-excel.constants smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-precios-excel.constants");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
