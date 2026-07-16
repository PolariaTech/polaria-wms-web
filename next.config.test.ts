import { describe, expect, it } from "vitest";
import nextConfig, { NEST_API_REWRITE_SOURCE } from "./next.config";

describe("next.config", () => {
  it("excluye handlers locales del rewrite hacia Nest", async () => {
    expect(NEST_API_REWRITE_SOURCE).toContain("pedido-proveedor");
    expect(NEST_API_REWRITE_SOURCE).toContain("evidencia-transporte");

    const rewrites = await nextConfig.rewrites!();
    const rules = "afterFiles" in rewrites ? rewrites.afterFiles : rewrites;

    expect(rules).toEqual([
      expect.objectContaining({
        source: NEST_API_REWRITE_SOURCE,
        destination: expect.stringContaining("polaria-wms-api"),
      }),
    ]);
  });
});
