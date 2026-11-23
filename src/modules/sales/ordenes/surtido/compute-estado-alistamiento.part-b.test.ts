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
