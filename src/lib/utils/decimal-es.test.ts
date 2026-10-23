import { describe, expect, it } from "vitest";
import {
  coerceLeadingDecimalInput,
  formatDecimalInputEs,
  formatKgEs,
  formatPrecioEs,
  formatPrecioInputMx,
  parseDecimalEs,
  sanitizeDecimalInputEs,
  sanitizePrecioInputMx,
} from "@/lib/utils/decimal-es";

describe("decimal-es", () => {
  it("parseDecimalEs acepta coma decimal", () => {
    expect(parseDecimalEs("15,6")).toBe(15.6);
    expect(parseDecimalEs("15.6")).toBe(15.6);
  });

  it("parseDecimalEs acepta decimal inicial .6 y ,6 como 0.6", () => {
    expect(parseDecimalEs(".6")).toBe(0.6);
    expect(parseDecimalEs(",6")).toBe(0.6);
    expect(parseDecimalEs("0,6")).toBe(0.6);
  });

  it("coerceLeadingDecimalInput antepone 0 a punto o coma inicial", () => {
    expect(coerceLeadingDecimalInput(".")).toBe("0,");
    expect(coerceLeadingDecimalInput(",")).toBe("0,");
    expect(coerceLeadingDecimalInput(".6")).toBe("0,6");
    expect(coerceLeadingDecimalInput(",6")).toBe("0,6");
    expect(coerceLeadingDecimalInput("15.6")).toBe("15.6");
  });

  it("sanitizeDecimalInputEs recorta letras y unifica el decimal a coma", () => {
    expect(sanitizeDecimalInputEs("12a")).toBe("12");
    expect(sanitizeDecimalInputEs("1b2,3c")).toBe("12,3");
    expect(sanitizeDecimalInputEs("abc")).toBe("");
    expect(sanitizeDecimalInputEs("15.6")).toBe("15,6");
    expect(sanitizeDecimalInputEs("-4")).toBe("4");
  });

  it("formatDecimalInputEs usa coma decimal", () => {
    expect(formatDecimalInputEs(0.6)).toBe("0,6");
    expect(formatDecimalInputEs(12)).toBe("12");
  });

  it("formatKgEs formatea peso sin decimales innecesarios", () => {
    expect(formatKgEs(60)).toBe("60");
    expect(formatKgEs(60.5)).toContain("60");
    expect(formatKgEs(1500)).toContain("1");
  });

  it("formatPrecioEs usa formato pesos mexicanos con centavos", () => {
    expect(formatPrecioEs(208)).toBe("208.00");
    expect(formatPrecioEs(243.48)).toBe("243.48");
    expect(formatPrecioEs(4741)).toBe("4,741.00");
    expect(formatPrecioEs(2 * 121.74)).toBe("243.48");
  });

  it("sanitizePrecioInputMx y formatPrecioInputMx usan punto decimal", () => {
    expect(sanitizePrecioInputMx("121,74")).toBe("121.74");
    expect(sanitizePrecioInputMx("121.74")).toBe("121.74");
    expect(formatPrecioInputMx(121.74)).toBe("121.74");
    expect(formatPrecioInputMx(26)).toBe("26");
  });
});
