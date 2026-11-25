import { describe, expect, it } from "vitest";

describe("comprador-alias-create-modal.view smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-alias-create-modal.view");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});