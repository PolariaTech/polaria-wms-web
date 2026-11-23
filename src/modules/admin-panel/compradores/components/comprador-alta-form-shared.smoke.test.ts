import { describe, expect, it } from "vitest";

describe("comprador-alta-form-shared smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-alta-form-shared");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
