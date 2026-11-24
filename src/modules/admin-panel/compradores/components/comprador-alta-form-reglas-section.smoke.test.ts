import { describe, expect, it } from "vitest";

describe("comprador-alta-form-reglas-section smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-alta-form-reglas-section");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
