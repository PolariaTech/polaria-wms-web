import { describe, expect, it } from "vitest";

describe("comprador-alta-form-condiciones-section smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-alta-form-condiciones-section");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
