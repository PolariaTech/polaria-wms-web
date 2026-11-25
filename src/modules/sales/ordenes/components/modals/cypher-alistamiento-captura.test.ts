import { describe, expect, it } from "vitest";
import { campoCaptura, formatElapsedSince } from "./cypher-alistamiento-captura";

describe("cypher-alistamiento-captura", () => {
  it("campoCaptura ignora mayúsculas en claves", () => {
    expect(
      campoCaptura({ DespachoNombre: "  Ana  " }, "despachoNombre"),
    ).toBe("Ana");
  });

  it("formatElapsedSince describe minutos recientes", () => {
    const now = Date.parse("2026-01-01T12:10:00Z");
    const iso = "2026-01-01T12:05:00Z";
    expect(formatElapsedSince(iso, now)).toBe("hace 5 min");
  });
});