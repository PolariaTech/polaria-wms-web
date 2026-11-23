import { describe, expect, it } from "vitest";

describe("comprador-edit-modal.view smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-edit-modal.view");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});