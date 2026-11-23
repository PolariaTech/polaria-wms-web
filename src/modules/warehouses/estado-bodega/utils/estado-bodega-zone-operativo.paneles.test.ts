import { describe, expect, it } from "vitest";
import * as barrel from "./estado-bodega-zone-operativo";
import * as part from "./estado-bodega-zone-operativo.paneles";

describe("estado-bodega-zone-operativo.paneles", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.collectDemoraAlertasOperativas).toBe(part.collectDemoraAlertasOperativas);
    expect(barrel.buildUbicacionesOrigenPendientesIds).toBe(part.buildUbicacionesOrigenPendientesIds);
    expect(barrel.buildEstadoBodegaZonePanels).toBe(part.buildEstadoBodegaZonePanels);
    expect(barrel.countPanelItems).toBe(part.countPanelItems);
  });
});
