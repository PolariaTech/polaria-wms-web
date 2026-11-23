import { describe, expect, it } from "vitest";
import * as barrel from "./estado-bodega-zone-operativo";
import * as part from "./estado-bodega-zone-operativo.tareas";

describe("estado-bodega-zone-operativo.tareas", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.enrichTareasConOrden).toBe(part.enrichTareasConOrden);
    expect(barrel.isTareaVinculadaOrdenVenta).toBe(part.isTareaVinculadaOrdenVenta);
    expect(barrel.isTareaOvSalidaRegistrada).toBe(part.isTareaOvSalidaRegistrada);
    expect(barrel.isTareaOvPreparacionAlmacenamiento).toBe(part.isTareaOvPreparacionAlmacenamiento);
    expect(barrel.isTareaOrdenVentaEmitida).toBe(part.isTareaOrdenVentaEmitida);
    expect(barrel.resolveTareaOvKey).toBe(part.resolveTareaOvKey);
    expect(barrel.buildOvKeysSalidaResuelta).toBe(part.buildOvKeysSalidaResuelta);
    expect(barrel.buildTareasOcultasPorOrdenTerminal).toBe(part.buildTareasOcultasPorOrdenTerminal);
    expect(barrel.buildOvKeysSinStockEnOrigen).toBe(part.buildOvKeysSinStockEnOrigen);
    expect(barrel.shouldOcultarTareaOvPendiente).toBe(part.shouldOcultarTareaOvPendiente);
  });
});
