import { describe, expect, it } from "vitest";
import {
  MENSAJE_ETAPAS_PREFACTURA,
  filasPrefactura,
  nombreDeCentro,
  otAprobada,
  otImpresa,
  puedeConfirmarPrefactura,
  todasAprobadas,
} from "./prefactura-seguimiento";

const RECORRIDO = new Set(["confirmada", "alistada", "despachada"]);

describe("puedeConfirmarPrefactura", () => {
  it("exige el historial completo y que la orden ya esté despachada", () => {
    expect(puedeConfirmarPrefactura("despachada", RECORRIDO)).toBe(true);
    expect(puedeConfirmarPrefactura("despachada", new Set(["despachada"]))).toBe(false);
    expect(puedeConfirmarPrefactura("confirmada", RECORRIDO)).toBe(false);
    expect(MENSAJE_ETAPAS_PREFACTURA).toContain("Confirmada, Alistado y Despachado");
  });
});

describe("seguimiento por orden de trabajo", () => {
  const payloads = [
    { tipo: "impresion_prefactura", idOrdenTrabajo: "ot-1" },
    { tipo: "prefactura_aceptada", idOrdenTrabajo: "ot-2" },
  ];

  it("marca impresa y aprobada solo en la OT del evento", () => {
    expect(otImpresa(payloads, "ot-1")).toBe(true);
    expect(otImpresa(payloads, "ot-2")).toBe(false);
    expect(otAprobada(payloads, "ot-2")).toBe(true);
    expect(otAprobada(payloads, "ot-1")).toBe(false);
  });

  it("la orden se puede facturar cuando la última OT queda aprobada", () => {
    const filas = [
      { id: "ot-1", numero: "1", centro: "Bar" },
      { id: "ot-2", numero: "2", centro: "Cocina" },
    ];
    expect(todasAprobadas(filas, payloads, "ot-1")).toBe(true);
    expect(todasAprobadas(filas, payloads, "ot-3")).toBe(false);
  });
});

describe("filasPrefactura", () => {
  it("usa el número de pedido de cada orden de trabajo", () => {
    expect(
      filasPrefactura(
        [
          { "Numero pedido": "12251", Almacen: "Bar", Cantidad: 1 },
          { "Numero pedido": "12252", Almacen: "Cocina", Cantidad: 1 },
        ],
        "OV-1",
      ),
    ).toEqual([
      expect.objectContaining({ numero: "12251", centro: "Bar" }),
      expect.objectContaining({ numero: "12252", centro: "Cocina" }),
    ]);
  });

  it("sin número de pedido no repite el centro en la columna de la OT", () => {
    const filas = filasPrefactura(
      [
        { Almacen: "COCINA CENTRAL", Cantidad: 1 },
        { Almacen: "ROYAL LEVEL", Cantidad: 1 },
      ],
      "OV-50",
    );

    expect(filas.map((fila) => fila.numero)).toEqual(["OT 1", "OT 2"]);
    expect(filas.map((fila) => fila.centro)).toEqual(["COCINA CENTRAL", "ROYAL LEVEL"]);
  });

  it("en el centro deja el nombre y quita el código corto", () => {
    expect(nombreDeCentro("ARSE Room Service")).toBe("Room Service");
    expect(nombreDeCentro("FYV AR87 Rest Medit 20")).toBe("Rest Medit 20");
    expect(nombreDeCentro("COCINA CENTRAL")).toBe("COCINA CENTRAL");
    expect(
      filasPrefactura(
        [{ "Numero pedido": "4502998262", Almacen: "ACOE ComedorEmplea", Cantidad: 1 }],
        "OV-52",
      )[0],
    ).toEqual(expect.objectContaining({ numero: "4502998262", centro: "ComedorEmplea" }));
  });
});
