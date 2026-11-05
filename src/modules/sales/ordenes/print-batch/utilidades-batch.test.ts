import { describe, expect, it } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import { horaEnCuenta, nombreArchivoBatch, ordenDeImpresion } from "./utilidades-batch";

const ov = (id: string) => ({ idOrdenVenta: id, venta: `OV-${id}` }) as OrdenVentaOperadorRow;
const hoja = (idOrdenVenta: string) => ({ idOrdenVenta }) as OrdenTareaAlmacenPrintData;

describe("nombreArchivoBatch", () => {
  it("lleva la fecha y la hora con ceros a la izquierda", () => {
    expect(nombreArchivoBatch(new Date(2026, 10, 5, 9, 7))).toBe("impresion-batch-20261105-0907.pdf");
  });
});

describe("horaEnCuenta", () => {
  it("usa la zona de la cuenta", () => {
    const instante = new Date("2026-11-05T20:42:00Z");
    expect(horaEnCuenta("America/Bogota", instante)).toMatch(/3:42/);
  });

  it("con una zona inválida no falla y devuelve una hora", () => {
    expect(horaEnCuenta("No/Existe", new Date("2026-11-05T20:42:00Z"))).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("ordenDeImpresion", () => {
  it("devuelve las OV en el orden en que aparecen sus hojas, sin repetir", () => {
    const resumen = [
      { row: ov("a"), ots: [1] },
      { row: ov("b"), ots: [1, 2] },
    ];
    const res = ordenDeImpresion({
      resumen,
      hojas: [hoja("b"), hoja("a"), hoja("b")],
    });
    expect(res.map((item) => item.row.idOrdenVenta)).toEqual(["b", "a"]);
  });

  it("ignora hojas de OV que no están en el resumen", () => {
    const res = ordenDeImpresion({ resumen: [{ row: ov("a"), ots: [1] }], hojas: [hoja("x"), hoja("a")] });
    expect(res).toHaveLength(1);
  });
});
