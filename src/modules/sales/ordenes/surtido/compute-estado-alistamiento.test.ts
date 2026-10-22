import { describe, expect, it } from "vitest";
import {
  capturaTieneAlistoCompleto,
  computeEstadoAlistamientoFromCapturas,
  puedeAplicarEstadoAlistamiento,
} from "./compute-estado-alistamiento";

describe("computeEstadoAlistamientoFromCapturas", () => {
  it("sin fotos no cambia estado", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 10,
        ordenesTrabajoConFoto: 0,
        ordenesTrabajoConAlistoCompleto: 0,
      }),
    ).toBeNull();
  });

  it("con foto pero sin Alistó completo queda en alistamiento", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 1,
        ordenesTrabajoConFoto: 1,
        ordenesTrabajoConAlistoCompleto: 0,
      }),
    ).toBe("alistamiento");
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 10,
        ordenesTrabajoConFoto: 10,
        ordenesTrabajoConAlistoCompleto: 9,
      }),
    ).toBe("alistamiento");
  });

  it("con 1 de N fotos pasa a alistamiento", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 10,
        ordenesTrabajoConFoto: 1,
        ordenesTrabajoConAlistoCompleto: 1,
      }),
    ).toBe("alistamiento");
  });

  it("con todas las OT foto + Alistó completo pasa a alistada", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 10,
        ordenesTrabajoConFoto: 10,
        ordenesTrabajoConAlistoCompleto: 10,
      }),
    ).toBe("alistada");
  });

  it("una sola hoja: Alistó completo → alistada", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 0,
        ordenesTrabajoConFoto: 1,
        ordenesTrabajoConAlistoCompleto: 1,
      }),
    ).toBe("alistada");
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 1,
        ordenesTrabajoConFoto: 1,
        ordenesTrabajoConAlistoCompleto: 1,
      }),
    ).toBe("alistada");
  });
});

describe("capturaTieneAlistoCompleto", () => {
  it("exige alisto true en cada índice esperado", () => {
    expect(
      capturaTieneAlistoCompleto(
        {
          campos: {},
          checks: {},
          lineas: [
            { indice: 1, alisto: true, reviso: false },
            { indice: 2, alisto: true, reviso: false },
          ],
        },
        2,
      ),
    ).toBe(true);
    expect(
      capturaTieneAlistoCompleto(
        {
          campos: {},
          checks: {},
          lineas: [
            { indice: 1, alisto: true, reviso: false },
            { indice: 2, alisto: false, reviso: false },
          ],
        },
        2,
      ),
    ).toBe(false);
  });
});

describe("puedeAplicarEstadoAlistamiento", () => {
  it("solo desde confirmada / alistamiento / alistada", () => {
    expect(puedeAplicarEstadoAlistamiento("confirmada")).toBe(true);
    expect(puedeAplicarEstadoAlistamiento("alistamiento")).toBe(true);
    expect(puedeAplicarEstadoAlistamiento("alistada")).toBe(true);
    expect(puedeAplicarEstadoAlistamiento("despachada")).toBe(false);
    expect(puedeAplicarEstadoAlistamiento("cerrada")).toBe(false);
    expect(puedeAplicarEstadoAlistamiento("en_preparacion")).toBe(false);
  });
});
