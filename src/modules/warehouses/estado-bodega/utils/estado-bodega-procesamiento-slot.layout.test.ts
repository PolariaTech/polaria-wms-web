import { describe, expect, it } from "vitest";
import * as barrel from "./estado-bodega-procesamiento-slot";
import * as part from "./estado-bodega-procesamiento-slot.layout";

describe("estado-bodega-procesamiento-slot.layout", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.applyResultadoVisualEnAlmacenamiento).toBe(part.applyResultadoVisualEnAlmacenamiento);
    expect(barrel.applyProcesamientoZonaLayout).toBe(part.applyProcesamientoZonaLayout);
    expect(barrel.buildResultadoByUbicacionProcesamiento).toBe(part.buildResultadoByUbicacionProcesamiento);
    expect(barrel.enrichProcesamientoSlotDetalles).toBe(part.enrichProcesamientoSlotDetalles);
  });
});
