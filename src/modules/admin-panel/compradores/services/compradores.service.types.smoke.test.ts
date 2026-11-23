import { describe, expect, it } from "vitest";

describe("compradores.service.types smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./compradores.service.types");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
