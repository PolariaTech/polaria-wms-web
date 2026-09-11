import { describe, expect, it } from "vitest";
import {
  buildOrdenVentaPatchFromSurtido,
  parseCantidadPreparadaKg,
} from "./sync-surtido-to-orden-venta";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

describe("parseCantidadPreparadaKg", () => {
  it("lee números con unidad", () => {
    expect(parseCantidadPreparadaKg("5 kg")).toBe(5);
    expect(parseCantidadPreparadaKg("12,5 kilos")).toBe(12.5);
    expect(parseCantidadPreparadaKg("3")).toBe(3);
  });

  it("devuelve null si no hay número", () => {
    expect(parseCantidadPreparadaKg("")).toBeNull();
    expect(parseCantidadPreparadaKg("n/a")).toBeNull();
  });
});

describe("buildOrdenVentaPatchFromSurtido", () => {
  const payload: OrdenSurtidoCapturaPayload = {
    campos: {
      horaSugeridaSalida: "04:30",
      chofer: "Luis Mendoza",
      unidad: "Camión 12",
      facturaAsociada: "F-99",
    },
    checks: { turnoPm: true },
    lineas: [
      { indice: 1, cantidadPreparada: "5 kg", nota: "ok" },
      { indice: 2, cantidadPreparada: "" },
    ],
    observacionesIa: null,
  };

  it("arma flat + lineas solo con valores de la foto", () => {
    const { flat, lineas } = buildOrdenVentaPatchFromSurtido({
      payload,
      observacionesActuales: null,
      productosByIndex: new Map([[1, "HAMBURGUESA"]]),
    });

    expect(flat.turno).toBe("PM");
    expect(flat.hora_salida).toBe("04:30");
    expect(flat.chofer).toBe("Luis Mendoza");
    expect(flat.unidad).toBe("Camión 12");
    expect(flat.observaciones).toContain("Chofer: Luis Mendoza");
    expect(flat.notas_almacen).toContain("Factura asociada: F-99");
    expect(flat.notas_lineas).toContain("HAMBURGUESA");
    expect(lineas).toEqual([
      { indice: 1, cantidadDespachada: 5, notaLinea: "ok" },
    ]);
  });

  it("no pisa observaciones previas; fusiona etiquetas", () => {
    const prev =
      "Datos:\nPrioridad: Urgente\nChofer: Viejo\n\nPedido original:\nhola";
    const { flat } = buildOrdenVentaPatchFromSurtido({
      payload: {
        campos: { chofer: "Nuevo" },
        checks: {},
        lineas: [],
      },
      observacionesActuales: prev,
    });

    expect(flat.chofer).toBe("Nuevo");
    expect(flat.observaciones).toContain("Chofer: Nuevo");
    expect(flat.observaciones).toContain("Prioridad: Urgente");
  });
});
