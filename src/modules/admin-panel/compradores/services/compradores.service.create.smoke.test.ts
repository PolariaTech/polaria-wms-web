import { describe, expect, it } from "vitest";

describe("compradores.service.create smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./compradores.service.create");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
