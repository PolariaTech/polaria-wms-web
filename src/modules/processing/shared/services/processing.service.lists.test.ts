import { describe, expect, it } from "vitest";
import * as barrel from "./processing.service";
import * as part from "./processing.service.lists";

describe("processing.service.lists", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.listSolicitudesProcesamiento).toBe(part.listSolicitudesProcesamiento);
    expect(barrel.listSolicitudesProcesamientoOperador).toBe(part.listSolicitudesProcesamientoOperador);
    expect(barrel.listTareasCola).toBe(part.listTareasCola);
    expect(barrel.listProductosPrimariosProcesamiento).toBe(part.listProductosPrimariosProcesamiento);
    expect(barrel.listProductosPrimariosConSecundarioProcesamiento).toBe(part.listProductosPrimariosConSecundarioProcesamiento);
    expect(barrel.listProductosSecundariosProcesamiento).toBe(part.listProductosSecundariosProcesamiento);
    expect(barrel.getStockProductoBodega).toBe(part.getStockProductoBodega);
  });
});
