import { describe, expect, it } from "vitest";
import * as barrel from "./estado-bodega-procesamiento-slot";
import * as part from "./estado-bodega-procesamiento-slot.shared";

describe("estado-bodega-procesamiento-slot.shared", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.isSolicitudActivaEnProcesamiento).toBe(part.isSolicitudActivaEnProcesamiento);
    expect(barrel.parsePositiveNumber).toBe(part.parsePositiveNumber);
    expect(barrel.resultadoYaUbicadoEnOrdenes).toBe(part.resultadoYaUbicadoEnOrdenes);
    expect(barrel.resolveSobranteKgPendienteEnMapa).toBe(part.resolveSobranteKgPendienteEnMapa);
    expect(barrel.padProcesamientoSlots).toBe(part.padProcesamientoSlots);
  });
});
