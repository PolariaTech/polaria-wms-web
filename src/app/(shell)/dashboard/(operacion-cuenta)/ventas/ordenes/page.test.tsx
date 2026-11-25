import { describe, expect, it, vi } from "vitest";

vi.mock("next/dynamic", () => ({
  default: () =>
    function DynamicStub() {
      return null;
    },
}));

describe("DashboardVentasOrdenesPage", () => {
  it("exporta la página con carga diferida del listado", async () => {
    const mod = await import("./page");
    expect(typeof mod.default).toBe("function");
  });
});
