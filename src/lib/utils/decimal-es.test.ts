import { describe, expect, it } from "vitest";
import { formatKgEs, parseDecimalEs } from "@/lib/utils/decimal-es";

describe("decimal-es", () => {
  it("parseDecimalEs acepta coma decimal", () => {
    expect(parseDecimalEs("15,6")).toBe(15.6);
    expect(parseDecimalEs("15.6")).toBe(15.6);
  });

  it("formatKgEs formatea peso sin decimales innecesarios", () => {
    expect(formatKgEs(60)).toBe("60");
    expect(formatKgEs(60.5)).toContain("60");
    expect(formatKgEs(1500)).toContain("1");
  });
});
