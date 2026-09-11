import { describe, expect, it } from "vitest";
import { puedeEditarOrdenVenta } from "./sales-status";

describe("puedeEditarOrdenVenta", () => {
  it("permite borrador, confirmada y en preparación", () => {
    expect(puedeEditarOrdenVenta("borrador")).toBe(true);
    expect(puedeEditarOrdenVenta("confirmada")).toBe(true);
    expect(puedeEditarOrdenVenta("en_preparacion")).toBe(true);
  });

  it("bloquea estados posteriores o finales", () => {
    expect(puedeEditarOrdenVenta("parcialmente_despachada")).toBe(false);
    expect(puedeEditarOrdenVenta("despachada")).toBe(false);
    expect(puedeEditarOrdenVenta("cerrada")).toBe(false);
    expect(puedeEditarOrdenVenta("cancelada")).toBe(false);
  });
});
