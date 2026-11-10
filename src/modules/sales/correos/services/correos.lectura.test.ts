import { describe, expect, it } from "vitest";
import { leerCamposDelFlujo } from "./correos.lectura";

describe("leerCamposDelFlujo (REQ-275)", () => {
  it("devuelve los cuatro campos tal como los anotó el flujo", () => {
    expect(
      leerCamposDelFlujo({
        resultado: "duplicado",
        confianza: "baja",
        tipo: "pedido",
        codigoOrdenVenta: "OV-1, OV-2",
      }),
    ).toMatchObject({
      resultado: "duplicado",
      confianza: "baja",
      tipo: "pedido",
      codigoOrdenVenta: "OV-1, OV-2",
    });
  });

  it("acepta cada resultado y cada confianza conocidos", () => {
    for (const resultado of ["recibido", "ingresado", "duplicado", "error", "no_es_pedido"]) {
      expect(leerCamposDelFlujo({ resultado }).resultado).toBe(resultado);
    }
    for (const confianza of ["alta", "media", "baja"]) {
      expect(leerCamposDelFlujo({ confianza }).confianza).toBe(confianza);
    }
  });

  it("un valor desconocido o de otro tipo queda en null", () => {
    expect(
      leerCamposDelFlujo({ resultado: "otro", confianza: 1, tipo: false, codigoOrdenVenta: [] }),
    ).toMatchObject({ resultado: null, confianza: null, tipo: null, codigoOrdenVenta: null });
  });

  it("sin los campos (filas anteriores a la columna) todo queda en null", () => {
    expect(leerCamposDelFlujo({})).toEqual({
      nuevoPedido: null,
      motivo: null,
      resultado: null,
      confianza: null,
      tipo: null,
      codigoOrdenVenta: null,
      idRegistro: null,
      registradoEn: null,
      actualizadoEn: null,
    });
  });

  it("lee las columnas de siempre: nuevoPedido solo si es booleano, y el motivo y los datos de sistema", () => {
    expect(
      leerCamposDelFlujo({
        nuevoPedido: false,
        motivo: "Cotización",
        idRegistro: "299",
        registradoEn: "2026-11-03T13:28:42.556Z",
        actualizadoEn: "2026-11-03T13:29:10.000Z",
      }),
    ).toMatchObject({
      nuevoPedido: false,
      motivo: "Cotización",
      idRegistro: "299",
      registradoEn: "2026-11-03T13:28:42.556Z",
      actualizadoEn: "2026-11-03T13:29:10.000Z",
    });
    expect(leerCamposDelFlujo({ nuevoPedido: "no" }).nuevoPedido).toBeNull();
  });
});
