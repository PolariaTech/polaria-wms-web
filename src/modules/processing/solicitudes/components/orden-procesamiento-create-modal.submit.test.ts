import { describe, expect, it } from "vitest";
import { validateOrdenProcesamientoSubmit } from "./orden-procesamiento-create-modal.submit";

const base = {
  codigoCuenta: "ACME",
  idBodega: "b1",
  idSolicitante: "u1",
  insumoValido: true,
  idSecundario: "s1",
  conversionValue: 10,
  cantidadElegida: 5,
  maxCantidad: 20,
  perdidaPctDelCatalogo: 0,
};

describe("validateOrdenProcesamientoSubmit", () => {
  it("rechaza sin bodega", () => {
    expect(validateOrdenProcesamientoSubmit({ ...base, idBodega: "" })).toEqual({
      ok: false,
      error: "Selecciona una bodega interna (mapa) válida.",
    });
  });

  it("rechaza cantidad superior al stock", () => {
    const result = validateOrdenProcesamientoSubmit({ ...base, cantidadElegida: 25 });
    expect(result.ok).toBe(false);
  });

  it("rechaza sin conversión", () => {
    expect(validateOrdenProcesamientoSubmit({ ...base, conversionValue: null }).ok).toBe(false);
  });

  it("devuelve el estimado cuando todo es válido", () => {
    const result = validateOrdenProcesamientoSubmit(base);
    expect(result).toMatchObject({ ok: true, codigoCuenta: "ACME", cantidadValue: 5, conversionValue: 10 });
  });
});
