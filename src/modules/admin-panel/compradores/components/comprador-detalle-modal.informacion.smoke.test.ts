import { describe, expect, it } from "vitest";

describe("comprador-detalle-modal.informacion smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./comprador-detalle-modal.informacion");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
