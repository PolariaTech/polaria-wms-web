import { describe, expect, it } from "vitest";
import * as service from "./productos-catalogo.service";
import * as part from "./productos-catalogo.precios-admin";

describe("productos-catalogo.precios-admin", () => {
  it("expone sus funciones públicas y el barrel las reexporta", () => {
    const names = Object.keys(part).filter(
      (key) => typeof (part as Record<string, unknown>)[key] === "function",
    );
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect((service as Record<string, unknown>)[name]).toBe(
        (part as Record<string, unknown>)[name],
      );
    }
  });
});
