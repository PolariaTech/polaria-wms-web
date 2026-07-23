import { describe, expect, it } from "vitest";
import {
  analyzePassword,
  normalizePasswordInput,
} from "./password-strength";

describe("password-strength", () => {
  it("rechaza contraseñas cortas o comunes", () => {
    expect(analyzePassword("abc").isValid).toBe(false);
    expect(analyzePassword("password").isValid).toBe(false);
    expect(analyzePassword("12345678").isValid).toBe(false);
    expect(analyzePassword("Admin123").isValid).toBe(false);
  });

  it("acepta una clave que cumple todos los requisitos", () => {
    const analysis = analyzePassword("ClaveSegura1!");
    expect(analysis.isValid).toBe(true);
    expect(analysis.score).toBeGreaterThanOrEqual(3);
    expect(analysis.checks.length).toBe(true);
    expect(analysis.checks.upper).toBe(true);
    expect(analysis.checks.lower).toBe(true);
    expect(analysis.checks.number).toBe(true);
    expect(analysis.checks.special).toBe(true);
    expect(analysis.checks.common).toBe(true);
  });

  it("recorta espacios al inicio y final", () => {
    expect(normalizePasswordInput("  Hola123!  ")).toBe("Hola123!");
  });
});
