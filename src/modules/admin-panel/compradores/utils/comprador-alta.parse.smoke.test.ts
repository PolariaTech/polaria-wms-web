import { describe, expect, it } from "vitest";

describe("comprador-alta.parse smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-alta.parse");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
