import { describe, expect, it } from "vitest";
import * as barrel from "./estado-bodega-zone-operativo";
import * as part from "./estado-bodega-zone-operativo.secciones";

describe("estado-bodega-zone-operativo.secciones", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.filterTareasOvDuplicadas).toBe(part.filterTareasOvDuplicadas);
    expect(barrel.resolveTareaSectionId).toBe(part.resolveTareaSectionId);
    expect(barrel.isTareaAsignada).toBe(part.isTareaAsignada);
    expect(barrel.isTareaAsignadaOperativa).toBe(part.isTareaAsignadaOperativa);
    expect(barrel.isTareaPendienteOperativa).toBe(part.isTareaPendienteOperativa);
    expect(barrel.getTareaEdadMs).toBe(part.getTareaEdadMs);
    expect(barrel.isTareaDemorada).toBe(part.isTareaDemorada);
  });
});
