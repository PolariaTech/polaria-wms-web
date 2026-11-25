import { describe, expect, it } from "vitest";

describe("comprador-alta-form-fields smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-alta-form-fields");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
