import { describe, expect, it } from "vitest";
import { fila, ingreso } from "../testing/correos.fixtures";
import {
  estadoDelIngreso,
  puedeIngresarAMano,
  separarCodigosOrden,
  type EstadoIngreso,
} from "./estado-ingreso";

const AHORA = Date.parse("2026-11-09T15:00:00.000Z");
const HACE_1_MIN = "2026-11-09T14:59:00.000Z";
const HACE_10_MIN = "2026-11-09T14:50:00.000Z";

const estado = (parcial: Parameters<typeof fila>[0]): EstadoIngreso =>
  estadoDelIngreso(fila({ nuevoPedido: null, motivo: null, ...parcial }), AHORA);

describe("separarCodigosOrden", () => {
  it("reparte varias OV separadas por coma y descarta vacíos", () => {
    expect(separarCodigosOrden("OV-1, OV-2 ,, OV-3")).toEqual(["OV-1", "OV-2", "OV-3"]);
    expect(separarCodigosOrden("OV-00001132")).toEqual(["OV-00001132"]);
    expect(separarCodigosOrden(null)).toEqual([]);
    expect(separarCodigosOrden("  ")).toEqual([]);
  });
});

describe("estadoDelIngreso", () => {
  it("1. un ingreso manual terminado gana sobre todo lo demás", () => {
    expect(
      estado({
        resultado: "duplicado",
        ingreso: ingreso({ estado: "ingresado", codigoOrdenVenta: "OV-9" }),
      }),
    ).toEqual({ tipo: "ingresado", codigos: ["OV-9"] });
  });

  it("1. un ingreso manual terminado sin código se dice sin inventarlo", () => {
    expect(estado({ ingreso: ingreso({ estado: "ingresado" }) })).toEqual({
      tipo: "ingresado",
      codigos: [],
    });
  });

  it("2. un ingreso en curso se muestra como «ingresando»", () => {
    expect(estado({ ingreso: ingreso({ estado: "procesando" }) })).toEqual({ tipo: "ingresando" });
  });

  it("3. si el flujo anotó la OV, se dice en cuál quedó (una o varias)", () => {
    expect(estado({ resultado: "ingresado", codigoOrdenVenta: "OV-00001132" })).toEqual({
      tipo: "ingresado",
      codigos: ["OV-00001132"],
    });
    expect(estado({ resultado: "ingresado", codigoOrdenVenta: "OV-1, OV-2" })).toEqual({
      tipo: "ingresado",
      codigos: ["OV-1", "OV-2"],
    });
  });

  it("4. un ingreso manual fallido ofrece reintentar", () => {
    expect(estado({ ingreso: ingreso({ estado: "error", error: "x" }) })).toEqual({
      tipo: "ingresar",
      reintentar: true,
      aviso: null,
    });
  });

  it("4. un error de vencimiento del api también ofrece reintentar", () => {
    expect(
      estado({
        ingreso: ingreso({
          estado: "error",
          error: "El ingreso no terminó. Toca Reintentar.",
        }),
      }),
    ).toEqual({ tipo: "ingresar", reintentar: true, aviso: null });
  });

  it("5. un duplicado avisa y deja ingresarlo a mano", () => {
    expect(estado({ resultado: "duplicado" })).toEqual({
      tipo: "ingresar",
      reintentar: false,
      aviso: "duplicado",
    });
  });

  it("6. un error del flujo avisa y deja ingresarlo a mano", () => {
    expect(estado({ resultado: "error" })).toEqual({
      tipo: "ingresar",
      reintentar: false,
      aviso: "flujoFallo",
    });
  });

  it("7. un correo descartado deja ingresarlo; con confianza dudosa se marca para revisar", () => {
    expect(estado({ nuevoPedido: false })).toEqual({
      tipo: "ingresar",
      reintentar: false,
      aviso: null,
    });
    expect(estado({ nuevoPedido: false, confianza: "alta" })).toMatchObject({ aviso: null });
    expect(estado({ nuevoPedido: false, confianza: "media" })).toMatchObject({ aviso: "revisar" });
    expect(estado({ nuevoPedido: false, confianza: "baja" })).toMatchObject({ aviso: "revisar" });
  });

  it("7. «no es pedido» sin nuevoPedido también deja ingresarlo a mano", () => {
    expect(estado({ resultado: "no_es_pedido" })).toMatchObject({ tipo: "ingresar" });
  });

  it("8. recibido hace poco sigue procesándose; pasados 5 minutos queda sin procesar", () => {
    expect(estado({ resultado: "recibido", registradoEn: HACE_1_MIN })).toEqual({
      tipo: "procesando",
    });
    expect(estado({ resultado: "recibido", registradoEn: HACE_10_MIN })).toEqual({
      tipo: "ingresar",
      reintentar: false,
      aviso: "sinProcesar",
    });
  });

  it("8. recibido sin fecha de registro cuenta como sin procesar", () => {
    expect(estado({ resultado: "recibido", registradoEn: null })).toMatchObject({
      aviso: "sinProcesar",
    });
  });

  it("9. las filas anteriores a las columnas nuevas siguen como «ingresado por el flujo»", () => {
    expect(estado({ resultado: null, nuevoPedido: null })).toEqual({ tipo: "porElFlujo" });
    expect(estado({ resultado: "ingresado", codigoOrdenVenta: null })).toEqual({
      tipo: "porElFlujo",
    });
  });
});

describe("puedeIngresarAMano", () => {
  it("coincide con los estados que ofrecen el botón", () => {
    expect(puedeIngresarAMano(fila({ nuevoPedido: false }), AHORA)).toBe(true);
    expect(puedeIngresarAMano(fila({ nuevoPedido: null, resultado: "duplicado" }), AHORA)).toBe(true);
    expect(puedeIngresarAMano(fila({ nuevoPedido: null, resultado: "error" }), AHORA)).toBe(true);
    expect(puedeIngresarAMano(fila({ nuevoPedido: null }), AHORA)).toBe(false);
    expect(
      puedeIngresarAMano(
        fila({ nuevoPedido: null, resultado: "ingresado", codigoOrdenVenta: "OV-1" }),
        AHORA,
      ),
    ).toBe(false);
  });
});
