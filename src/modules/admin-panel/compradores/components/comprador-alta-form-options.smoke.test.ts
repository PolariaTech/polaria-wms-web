import { describe, expect, it } from "vitest";

describe("comprador-alta-form-options smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-alta-form-options");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
