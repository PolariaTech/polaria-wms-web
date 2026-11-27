import { describe, expect, it } from "vitest";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import {
  aplicarPrecioFaltanteALinea,
  precioCuandoLaSolicitudNoTrajo,
} from "./precio-cuando-falta-solicitud";
import { resolveCantidadPrecioParaPersistir } from "./persist-linea-avance";

function linea(parcial: Partial<LineaVentaForm> = {}): LineaVentaForm {
  return {
    idProducto: "epa",
    nombre: "EPAZOTE",
    codigo: "10501545",
    idBodega: "b1",
    cantidadInput: "0.3",
    cajasInput: "",
    presentacion: "",
    especificacion: "",
    ivaPct: "0",
    kgDisponible: 1,
    unidadMedida: "KGM",
    precioUnitario: 0,
    precioInput: "",
    precioManual: false,
    catalogPending: false,
    ...parcial,
  };
}

describe("precioCuandoLaSolicitudNoTrajo", () => {
  it("prefiere el último precio del cliente", () => {
    expect(
      precioCuandoLaSolicitudNoTrajo({
        ultimo: 60,
        lista: 10,
        equivalencia: 16,
      }),
    ).toBe(60);
  });

  it("usa la lista si no hay último", () => {
    expect(
      precioCuandoLaSolicitudNoTrajo({ lista: 10, equivalencia: 16 }),
    ).toBe(10);
  });

  it("usa la equivalencia si no hay último ni lista", () => {
    expect(precioCuandoLaSolicitudNoTrajo({ equivalencia: 16, lista: 0 })).toBe(
      16,
    );
  });

  it("usa el precio que ya muestra el catálogo si la equivalencia no llegó aparte", () => {
    expect(
      precioCuandoLaSolicitudNoTrajo({ lista: 0, precioDelPicker: 16 }),
    ).toBe(16);
  });

  it("no deja que el precio del catálogo gane al último vendido", () => {
    expect(
      precioCuandoLaSolicitudNoTrajo({
        ultimo: 60,
        precioDelPicker: 16,
      }),
    ).toBe(60);
  });

  it("deja 0 si no hay ninguno", () => {
    expect(precioCuandoLaSolicitudNoTrajo({})).toBe(0);
  });

  it("un precio negativo no se propone", () => {
    expect(
      precioCuandoLaSolicitudNoTrajo({ ultimo: -1, lista: -5 }),
    ).toBe(0);
  });
});

describe("contrato de precio vacío o 0 al confirmar", () => {
  it("persiste 0 y no devuelve mensaje de bloqueo", () => {
    for (const precioInput of ["", "0"]) {
      const result = resolveCantidadPrecioParaPersistir({
        isDraft: false,
        cantidadInput: "0.3",
        precioInput,
        nombreProducto: "EPAZOTE",
      });
      expect(result).toEqual({
        ok: true,
        cantidadPedida: 0.3,
        precioUnitario: 0,
      });
    }
  });
});

describe("aplicarPrecioFaltanteALinea", () => {
  const separados = { ultimos: {}, equivalencia: { epa: 16 } };
  const base = [
    {
      idProducto: "epa",
      precioUnitario: 0,
      label: "",
      idCliente: null,
      idBodega: "b1",
      codigo: "10501545",
      nombre: "EPAZOTE",
      kgDisponible: 1,
      unidadMedida: "KGM",
    },
  ];

  it("carga la equivalencia cuando la solicitud no trajo precio", () => {
    const next = aplicarPrecioFaltanteALinea(linea(), separados, base);
    expect(next.precioUnitario).toBe(16);
    expect(next.precioManual).toBe(false);
  });

  it("carga los 16 del catálogo aunque la equivalencia separada venga vacía", () => {
    const next = aplicarPrecioFaltanteALinea(
      linea(),
      { ultimos: {}, equivalencia: {} },
      base,
      16,
    );
    expect(next.precioUnitario).toBe(16);
    expect(next.precioInput).toBe("16");
  });

  it("no pisa un precio que ya vino en la solicitud o lo escribió el usuario", () => {
    const manual = linea({ precioManual: true, precioUnitario: 40, precioInput: "40" });
    expect(aplicarPrecioFaltanteALinea(manual, separados, base)).toBe(manual);
  });
});
