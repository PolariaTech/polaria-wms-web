import { describe, expect, it } from "vitest";
import type { OrdenVentaFormEntregaCoords } from "./orden-venta-form-entrega-coords";

describe("OrdenVentaFormEntregaCoords (REQ-251)", () => {
  it("tipa lat/lng anulables", () => {
    const sample: OrdenVentaFormEntregaCoords = {
      entregaLat: null,
      entregaLng: 1.5,
      setEntregaLat: () => undefined,
      setEntregaLng: () => undefined,
    };
    expect(sample.entregaLat).toBeNull();
    expect(sample.entregaLng).toBe(1.5);
  });
});
