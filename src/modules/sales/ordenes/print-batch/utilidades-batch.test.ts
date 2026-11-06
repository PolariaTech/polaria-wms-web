import { describe, expect, it } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import {
  hojasDelPaquete,
  horaEnCuenta,
  hoyEnCuenta,
  nombreArchivoBatch,
  ordenDeImpresion,
} from "./utilidades-batch";

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

describe("hoyEnCuenta", () => {
  it("da el día en la zona de la cuenta, no el de UTC", () => {
    // 2026-11-06 02:30 UTC todavía es 5 de noviembre en Colombia (UTC-5).
    const ahora = new Date("2026-11-06T02:30:00Z");

    expect(hoyEnCuenta("America/Bogota", ahora)).toBe("2026-11-05");
    expect(hoyEnCuenta("UTC", ahora)).toBe("2026-11-06");
  });

  it("con una zona inválida no falla y devuelve una fecha ISO", () => {
    expect(hoyEnCuenta("no-existe", new Date("2026-11-05T12:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("hojasDelPaquete", () => {
  const hojas = [{}, {}, {}] as OrdenTareaAlmacenPrintData[];
  const fila = { venta: "OV", cliente: "C", entrega: "", ot: 1, hojas: 1 };
  const resumenPdf = (filas: number) => ({
    titulo: "Resumen de impresión",
    subtitulo: "",
    generado: "",
    filas: Array.from({ length: filas }, () => fila),
  });

  it("sin resumen son solo las hojas de orden de tarea", () => {
    expect(hojasDelPaquete({ hojas })).toBe(3);
  });

  it("suma las páginas de OC de todas las partes y la hoja de notas del resumen", () => {
    const partes = [{ hojas: [], resumen: [], paginasExtra: 4 }, { hojas: [], resumen: [], paginasExtra: 3 }];

    // 3 de OT + 1 de resumen + 1 de notas + 7 de OC.
    expect(hojasDelPaquete({ hojas, resumenPdf: { ...resumenPdf(2), notas: ["una nota"] }, partes })).toBe(12);
  });

  it("con resumen suma las hojas que ocupa: una por cada 36 OV", () => {
    expect(hojasDelPaquete({ hojas, resumenPdf: resumenPdf(2) })).toBe(4);
    expect(hojasDelPaquete({ hojas, resumenPdf: resumenPdf(37) })).toBe(5);
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
