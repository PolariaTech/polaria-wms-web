import { describe, expect, it } from "vitest";

describe("compradores.service.patch smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./compradores.service.patch");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
