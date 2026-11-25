import { describe, expect, it } from "vitest";
import {
  buildOrdenVentaPatchFromSurtido,
  parseCantidadPreparadaKg,
  parseFechaManuscritaToIso,
} from "./sync-surtido-to-orden-venta";

describe("sync-surtido-to-orden-venta (barrel)", () => {
  it("reexporta API pública", () => {
    expect(parseCantidadPreparadaKg("1")).toBe(1);
    expect(parseFechaManuscritaToIso("2026-01-01")).toBe("2026-01-01");
    expect(buildOrdenVentaPatchFromSurtido).toBeTypeOf("function");
  });
});