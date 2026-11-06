import { describe, expect, it } from "vitest";
import nextConfig, { NEST_API_REWRITE_SOURCE } from "./next.config";

describe("next.config", () => {
  it("activa la caché de build de Turbopack (en Next 16.2.x no viene por defecto)", () => {
    expect(nextConfig.experimental?.turbopackFileSystemCacheForBuild).toBe(true);
  });

  it("excluye handlers locales del rewrite hacia Nest", async () => {
    expect(NEST_API_REWRITE_SOURCE).toContain("pedido-proveedor");
    expect(NEST_API_REWRITE_SOURCE).toContain("evidencia-transporte");
    expect(NEST_API_REWRITE_SOURCE).toContain("ventas/ordenes/[^/]+/log");

    const rewrites = await nextConfig.rewrites!();
    const rules = "afterFiles" in rewrites ? rewrites.afterFiles : rewrites;

    expect(rules).toEqual([
      expect.objectContaining({
        source: NEST_API_REWRITE_SOURCE,
        destination: expect.stringContaining("polaria-wms-api"),
      }),
    ]);
  });

  it("permite embeber adjuntos OV en iframe same-origin (REQ-266)", async () => {
    const headers = await nextConfig.headers!();
    const file = headers.find((rule) => rule.source === "/api/ov-adjuntos/file");
    const emlParts = headers.find(
      (rule) => rule.source === "/api/ov-adjuntos/eml-parts/file",
    );

    expect(file?.headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        }),
        expect.objectContaining({
          key: "Content-Security-Policy",
          value: "frame-ancestors 'self'",
        }),
      ]),
    );
    expect(emlParts?.headers).toEqual(file?.headers);
  });
});

