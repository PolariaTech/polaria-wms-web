import { describe, expect, it } from "vitest";
import {
  computeEstadoAlistamientoFromCapturas,
  puedeAplicarEstadoAlistamiento,
} from "./compute-estado-alistamiento";

describe("computeEstadoAlistamientoFromCapturas", () => {
  it("sin fotos no cambia estado", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 10,
        ordenesTrabajoConFoto: 0,
      }),
    ).toBeNull();
  });

  it("con 1 de N pasa a alistamiento", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 10,
        ordenesTrabajoConFoto: 1,
      }),
    ).toBe("alistamiento");
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 10,
        ordenesTrabajoConFoto: 9,
      }),
    ).toBe("alistamiento");
  });

  it("con todas las OT pasa a alistada", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 10,
        ordenesTrabajoConFoto: 10,
      }),
    ).toBe("alistada");
  });

  it("con una sola hoja o sin hijas, la primera foto deja alistada", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 0,
        ordenesTrabajoConFoto: 1,
      }),
    ).toBe("alistada");
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 1,
        ordenesTrabajoConFoto: 1,
      }),
    ).toBe("alistada");
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
