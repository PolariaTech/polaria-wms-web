import { describe, expect, it } from "vitest";
import { todayIsoDateBogota } from "./bodega-reportes-fecha";

describe("todayIsoDateBogota", () => {
  it("formatea el día calendario en America/Bogota", () => {
    // 2026-08-04 15:30 UTC = mismo día en Bogotá (UTC-5)
    expect(todayIsoDateBogota(new Date("2026-08-04T15:30:00.000Z"))).toBe(
      "2026-08-04",
    );
    // 2026-08-05 02:00 UTC = 2026-08-04 21:00 Bogotá
    expect(todayIsoDateBogota(new Date("2026-08-05T02:00:00.000Z"))).toBe(
      "2026-08-04",
    );
  });
});
