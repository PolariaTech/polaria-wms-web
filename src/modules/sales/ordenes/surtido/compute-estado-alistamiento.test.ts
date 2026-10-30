import { describe, expect, it } from "vitest";
import {
  capturaTieneAlistoCompleto,
  capturaTieneDespacho,
  capturaTieneFactura,
  capturaTieneRevisoCompleto,
  computeEstadoAlistamientoFromCapturas,
  estadoSurtidoEsAvance,
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

  it("con chulo de Revisó pasa a revisada aunque falte Alistó", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 1,
        ordenesTrabajoConFoto: 1,
        ordenesTrabajoConAlistoCompleto: 0,
        ordenesTrabajoConRevisoCompleto: 1,
      }),
    ).toBe("revisada");
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 10,
        ordenesTrabajoConFoto: 1,
        ordenesTrabajoConAlistoCompleto: 0,
        ordenesTrabajoConRevisoCompleto: 1,
      }),
    ).toBe("revisada");
  });

  it("con Alistó y chequeo Revisó pasa a revisada, sin saltar si falta el chequeo", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 1,
        ordenesTrabajoConFoto: 1,
        ordenesTrabajoConAlistoCompleto: 1,
        ordenesTrabajoConRevisoCompleto: 0,
      }),
    ).toBe("alistada");
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 2,
        ordenesTrabajoConFoto: 2,
        ordenesTrabajoConAlistoCompleto: 2,
        ordenesTrabajoConRevisoCompleto: 2,
      }),
    ).toBe("revisada");
  });

  it("la firma de Despachó pasa a despachada con o sin chulos", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 1,
        ordenesTrabajoConFoto: 1,
        ordenesTrabajoConAlistoCompleto: 0,
        ordenesTrabajoConRevisoCompleto: 0,
        ordenesTrabajoConDespacho: 1,
      }),
    ).toBe("despachada");
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 2,
        ordenesTrabajoConFoto: 1,
        ordenesTrabajoConAlistoCompleto: 0,
        ordenesTrabajoConRevisoCompleto: 1,
        ordenesTrabajoConDespacho: 1,
      }),
    ).toBe("despachada");
  });

  it("la firma de Factura (OK) pasa a facturada con o sin chulos", () => {
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 1,
        ordenesTrabajoConFoto: 1,
        ordenesTrabajoConAlistoCompleto: 0,
        ordenesTrabajoConRevisoCompleto: 0,
        ordenesTrabajoConFactura: 1,
      }),
    ).toBe("facturada");
    expect(
      computeEstadoAlistamientoFromCapturas({
        totalOrdenesTrabajo: 10,
        ordenesTrabajoConFoto: 1,
        ordenesTrabajoConAlistoCompleto: 1,
        ordenesTrabajoConRevisoCompleto: 1,
        ordenesTrabajoConDespacho: 1,
        ordenesTrabajoConFactura: 1,
      }),
    ).toBe("facturada");
  });
});

describe("estadoSurtidoEsAvance", () => {
  it("no regresa un hito ya alcanzado", () => {
    expect(estadoSurtidoEsAvance("despachada", "alistada")).toBe(false);
    expect(estadoSurtidoEsAvance("despachada", "revisada")).toBe(false);
    expect(estadoSurtidoEsAvance("facturada", "despachada")).toBe(false);
    expect(estadoSurtidoEsAvance("revisada", "despachada")).toBe(true);
    expect(estadoSurtidoEsAvance("despachada", "facturada")).toBe(true);
    expect(estadoSurtidoEsAvance("confirmada", "facturada")).toBe(true);
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
  it("avanza desde confirmada, alistamiento, alistada y revisada", () => {
    expect(puedeAplicarEstadoAlistamiento("confirmada")).toBe(true);
    expect(puedeAplicarEstadoAlistamiento("alistamiento")).toBe(true);
    expect(puedeAplicarEstadoAlistamiento("alistada")).toBe(true);
    expect(puedeAplicarEstadoAlistamiento("revisada")).toBe(true);
    expect(puedeAplicarEstadoAlistamiento("despachada")).toBe(true);
    expect(puedeAplicarEstadoAlistamiento("facturada")).toBe(false);
    expect(puedeAplicarEstadoAlistamiento("cerrada")).toBe(false);
    expect(puedeAplicarEstadoAlistamiento("en_preparacion")).toBe(false);
  });
});

describe("captura de revisión y despacho", () => {
  it("toma Revisó por chulos de línea o por la firma", () => {
    expect(
      capturaTieneRevisoCompleto(
        {
          campos: {},
          checks: {},
          lineas: [
            { indice: 1, alisto: true, reviso: true },
            { indice: 2, alisto: true, reviso: true },
          ],
        },
        2,
      ),
    ).toBe(true);
    expect(
      capturaTieneRevisoCompleto(
        {
          campos: { revisoNombre: "Mary" },
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
      capturaTieneRevisoCompleto(
        {
          campos: {},
          checks: {},
          lineas: [
            { indice: 1, alisto: false, reviso: true },
            { indice: 2, alisto: false, reviso: false },
          ],
        },
        2,
      ),
    ).toBe(true);
    expect(
      capturaTieneRevisoCompleto(
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

  it("toma Despachó por nombre u hora", () => {
    expect(
      capturaTieneDespacho({
        campos: { despachoHora: "10:30" },
        checks: {},
        lineas: [],
      }),
    ).toBe(true);
    expect(
      capturaTieneDespacho({
        campos: {},
        checks: {},
        lineas: [],
      }),
    ).toBe(false);
  });

  it("toma Factura (OK) por folio o firma", () => {
    expect(
      capturaTieneFactura({
        campos: { facturaOkFolio: "A-100" },
        checks: {},
        lineas: [],
      }),
    ).toBe(true);
    expect(
      capturaTieneFactura({
        campos: { "Factura asociada": "F-22" },
        checks: {},
        lineas: [],
      }),
    ).toBe(true);
    expect(
      capturaTieneFactura({
        campos: {},
        checks: {},
        lineas: [],
      }),
    ).toBe(false);
    expect(
      capturaTieneFactura({
        campos: { "Documentación folio": "FAC-10" },
        checks: {},
        lineas: [],
      }),
    ).toBe(true);
    expect(
      capturaTieneFactura({
        campos: { "Documentación firma": "Ana Ruiz" },
        checks: {},
        lineas: [],
      }),
    ).toBe(true);
    expect(
      capturaTieneFactura({
        campos: { "Documentó nombre": "Ana Ruiz", documentoNombre: "Ana Ruiz" },
        checks: {},
        lineas: [],
      }),
    ).toBe(false);
  });
});
