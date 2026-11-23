import { describe, expect, it } from "vitest";

describe("comprador-alta-form-identificacion-section smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-alta-form-identificacion-section");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
