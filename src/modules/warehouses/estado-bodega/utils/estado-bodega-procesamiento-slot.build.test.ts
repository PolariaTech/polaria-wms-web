import { describe, expect, it } from "vitest";
import * as barrel from "./estado-bodega-procesamiento-slot";
import * as part from "./estado-bodega-procesamiento-slot.build";

describe("estado-bodega-procesamiento-slot.build", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.buildProcesamientoEnriquecimientoByUbicacion).toBe(part.buildProcesamientoEnriquecimientoByUbicacion);
    expect(barrel.splitProcesamientoDualCajas).toBe(part.splitProcesamientoDualCajas);
  });
});
