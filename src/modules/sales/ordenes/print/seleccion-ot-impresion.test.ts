import { describe, expect, it } from "vitest";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";
import { agruparHojasPorOt, hojasDeLasOt } from "./seleccion-ot-impresion";

function hoja(
  tareaIndex: number | undefined,
  renglones: number,
  extra: Partial<OrdenTareaAlmacenPrintData> = {},
): OrdenTareaAlmacenPrintData {
  return {
    tareaIndex,
    tareaTotal: 3,
    centroConsumo: "Cocina central",
    lineas: Array.from({ length: renglones }, (_, i) => ({ producto: `P${i}` })),
    ...extra,
  } as unknown as OrdenTareaAlmacenPrintData;
}

describe("agruparHojasPorOt", () => {
  it("una fila por OT, ordenadas de la primera a la última", () => {
    const ots = agruparHojasPorOt([hoja(3, 2), hoja(1, 5), hoja(2, 1)]);

    expect(ots.map((ot) => ot.numero)).toEqual([1, 2, 3]);
    expect(ots.map((ot) => ot.renglones)).toEqual([5, 1, 2]);
  });

  it("una OT con muchos renglones ocupa varias hojas y suma sus renglones", () => {
    const ots = agruparHojasPorOt([hoja(1, 49), hoja(1, 49), hoja(1, 12), hoja(2, 3)]);

    expect(ots[0]).toMatchObject({ numero: 1, hojas: 3, renglones: 110 });
    expect(ots[1]).toMatchObject({ numero: 2, hojas: 1, renglones: 3 });
  });

  it("lleva el centro de consumo de la primera hoja que lo tenga", () => {
    const ots = agruparHojasPorOt([
      hoja(1, 1, { centroConsumo: "  " }),
      hoja(1, 1, { centroConsumo: "Bar" }),
      hoja(2, 1, { centroConsumo: "Comedor" }),
      hoja(3, 1, { centroConsumo: "" }),
    ]);

    expect(ots.map((ot) => ot.centro)).toEqual(["Bar", "Comedor", ""]);
  });

  it("el total de OT sale de las hojas; si no lo dicen, de la OT más alta", () => {
    expect(agruparHojasPorOt([hoja(1, 1), hoja(2, 1)]).every((ot) => ot.total === 3)).toBe(true);
    const sinTotal = agruparHojasPorOt([
      hoja(1, 1, { tareaTotal: undefined }),
      hoja(4, 1, { tareaTotal: undefined }),
    ]);
    expect(sinTotal.map((ot) => ot.total)).toEqual([4, 4]);
  });

  it("una hoja sin número cuenta como la OT 1 (OV de una sola OT)", () => {
    const ots = agruparHojasPorOt([hoja(undefined, 4, { tareaTotal: undefined })]);

    expect(ots).toEqual([{ numero: 1, total: 1, centro: "Cocina central", renglones: 4, hojas: 1 }]);
  });

  it("sin hojas no hay OT", () => {
    expect(agruparHojasPorOt([])).toEqual([]);
  });
});

describe("hojasDeLasOt", () => {
  const ots = agruparHojasPorOt([hoja(1, 49), hoja(1, 5), hoja(2, 3), hoja(3, 1)]);

  it("suma las hojas de las OT elegidas", () => {
    expect(hojasDeLasOt(ots, new Set([1, 3]))).toBe(3);
    expect(hojasDeLasOt(ots, new Set([2]))).toBe(1);
  });

  it("todas dan el total de hojas y ninguna da cero", () => {
    expect(hojasDeLasOt(ots, new Set([1, 2, 3]))).toBe(4);
    expect(hojasDeLasOt(ots, new Set())).toBe(0);
  });

  it("ignora números que no existen", () => {
    expect(hojasDeLasOt(ots, new Set([9]))).toBe(0);
  });
});
