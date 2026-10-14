import { describe, expect, it } from "vitest";
import {
  ORDERS_VISIBLE_DAYS,
  getOrdersVisibleSinceDate,
} from "./domain-query";

describe("getOrdersVisibleSinceDate", () => {
  it("usa 3 días por defecto (hoy inclusive)", () => {
    expect(ORDERS_VISIBLE_DAYS).toBe(3);
  });

  it("con 3 días: hoy, ayer y anteayer", () => {
    const now = new Date(2026, 9, 13, 15, 30, 0); // 13-oct-2026 local
    expect(getOrdersVisibleSinceDate(3, now)).toBe("2026-10-11");
  });

  it("con 1 día: solo hoy", () => {
    const now = new Date(2026, 9, 13, 8, 0, 0);
    expect(getOrdersVisibleSinceDate(1, now)).toBe("2026-10-13");
  });
});
