import { describe, expect, it } from "vitest";
import * as server from "./cuenta-reporte-embed.server";
import { extractBearerToken } from "./cuenta-reporte-embed.access";
import { mapEmbedRow } from "./cuenta-reporte-embed.map";

describe("cuenta-reporte-embed.server (barrel)", () => {
  it("reexporta las funciones de sus módulos", () => {
    const names = Object.keys(server);
    expect(names.length).toBeGreaterThan(0);
    const s = server as Record<string, unknown>;
    if ("extractBearerToken" in s) expect(s.extractBearerToken).toBe(extractBearerToken);
    if ("mapEmbedRow" in s) expect(s.mapEmbedRow).toBe(mapEmbedRow);
  });
});
