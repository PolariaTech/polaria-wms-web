import { describe, expect, it } from "vitest";
import * as part from "./cuenta-reporte-embed.tenant";

describe("cuenta-reporte-embed.tenant", () => {
  it("expone funciones públicas", () => {
    const names = Object.keys(part).filter(
      (key) => typeof (part as Record<string, unknown>)[key] === "function",
    );
    expect(names.length).toBeGreaterThan(0);
  });
});
