import { describe, expect, it } from "vitest";
import * as part from "./cuenta-reporte-embed.crud";

describe("cuenta-reporte-embed.crud", () => {
  it("expone funciones públicas", () => {
    const names = Object.keys(part).filter(
      (key) => typeof (part as Record<string, unknown>)[key] === "function",
    );
    expect(names.length).toBeGreaterThan(0);
  });
});
