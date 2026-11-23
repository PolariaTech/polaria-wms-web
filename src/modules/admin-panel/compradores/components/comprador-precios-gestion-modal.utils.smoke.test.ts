import { describe, expect, it } from "vitest";

describe("comprador-precios-gestion-modal.utils smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-precios-gestion-modal.utils");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
