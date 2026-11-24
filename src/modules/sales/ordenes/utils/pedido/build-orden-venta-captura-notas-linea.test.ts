import { describe, expect, it } from "vitest";
import {
  buildNotasLineasText,
  todayIsoDate,
} from "./build-orden-venta-captura-notas-linea";

describe("build-orden-venta-captura-notas-linea", () => {
  it("genera notas por línea y fecha ISO", () => {
    expect(todayIsoDate(new Date(2026, 8, 14))).toBe("2026-09-14");
    expect(
      buildNotasLineasText([
        { nombre: "Fresa", cantidad: 1, especificacion: "Firme" },
      ]),
    ).toContain("Fresa");
  });
});