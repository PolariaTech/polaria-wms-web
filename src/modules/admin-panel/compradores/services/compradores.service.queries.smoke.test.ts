import { describe, expect, it } from "vitest";

describe("compradores.service.queries smoke", () => {
  it("expone exports públicos", async () => {
    const mod = await import("./compradores.service.queries");
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});
