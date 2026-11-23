import { describe, expect, it } from "vitest";
import * as barrel from "./processing.service";
import * as part from "./processing.service.api";

describe("processing.service.api", () => {
  it("el barrel reexporta las mismas referencias", () => {
    expect(barrel.getSolicitudProcesamiento).toBe(part.getSolicitudProcesamiento);
    expect(barrel.getDesperdicioSugerido).toBe(part.getDesperdicioSugerido);
    expect(barrel.getDesperdicioSugeridoDetalle).toBe(part.getDesperdicioSugeridoDetalle);
    expect(barrel.asignarOperarioProcesamiento).toBe(part.asignarOperarioProcesamiento);
    expect(barrel.iniciarProcesamiento).toBe(part.iniciarProcesamiento);
    expect(barrel.asignarProcesadorProcesamiento).toBe(part.asignarProcesadorProcesamiento);
    expect(barrel.cerrarSolicitudProcesamiento).toBe(part.cerrarSolicitudProcesamiento);
    expect(barrel.crearOrdenesPostCierre).toBe(part.crearOrdenesPostCierre);
    expect(barrel.aplicarOrdenProcesamiento).toBe(part.aplicarOrdenProcesamiento);
    expect(barrel.terminarSolicitudProcesamiento).toBe(part.terminarSolicitudProcesamiento);
    expect(barrel.fetchProductoLabelsProcesamiento).toBe(part.fetchProductoLabelsProcesamiento);
  });
});
