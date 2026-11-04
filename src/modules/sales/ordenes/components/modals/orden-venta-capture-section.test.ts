import { describe, expect, it } from "vitest";
import { toDateInputValue } from "./orden-venta-capture-section";

describe("toDateInputValue", () => {
  it("recorta ISO a yyyy-mm-dd", () => {
    expect(toDateInputValue("2026-11-04T12:00:00.000Z")).toBe("2026-11-04");
  });

  it("vacío si no hay valor", () => {
    expect(toDateInputValue("  ")).toBe("");
  });
});
