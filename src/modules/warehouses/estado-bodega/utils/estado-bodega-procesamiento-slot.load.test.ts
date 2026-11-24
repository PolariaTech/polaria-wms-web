import { describe, expect, it } from "vitest";
import * as barrel from "./estado-bodega-procesamiento-slot";
import * as part from "./estado-bodega-procesamiento-slot.load";

describe("estado-bodega-procesamiento-slot.load", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.loadProcesamientoZonaParams).toBe(part.loadProcesamientoZonaParams);
    expect(barrel.loadProcesamientoEnriquecimientoByUbicacion).toBe(part.loadProcesamientoEnriquecimientoByUbicacion);
    expect(barrel.loadResultadoByUbicacionProcesamiento).toBe(part.loadResultadoByUbicacionProcesamiento);
  });
});
