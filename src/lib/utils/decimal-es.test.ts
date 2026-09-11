import { describe, expect, it } from "vitest";
import {
  coerceLeadingDecimalInput,
  formatDecimalInputEs,
  formatKgEs,
  parseDecimalEs,
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

  it("formatDecimalInputEs usa coma decimal", () => {
    expect(formatDecimalInputEs(0.6)).toBe("0,6");
    expect(formatDecimalInputEs(12)).toBe("12");
  });

  it("formatKgEs formatea peso sin decimales innecesarios", () => {
    expect(formatKgEs(60)).toBe("60");
    expect(formatKgEs(60.5)).toContain("60");
    expect(formatKgEs(1500)).toContain("1");
  });
});
