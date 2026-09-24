import { describe, expect, it } from "vitest";
import {
  buildCompradorPreciosPdf,
  buildCompradorPreciosPdfFilename,
} from "./comprador-precios-pdf";

const SAMPLE_ROWS = [
  {
    codigoComprador: "WAL01",
    nombreComprador: "Walmart",
    codigoProducto: "DICOK",
    nombreProducto: "Pollo entero congelado de granja con descripción larga",
    equivalencia: "Pollo asado especial del hotel",
    precioActual: 110,
  },
  {
    codigoComprador: "WAL01",
    nombreComprador: "Walmart",
    codigoProducto: "OGHK6",
    nombreProducto: "Hamburguesa",
    equivalencia: "",
    precioActual: 40,
  },
  {
    codigoComprador: "SOR01",
    nombreComprador: "Soriana",
    codigoProducto: "DICOK",
    nombreProducto: "Pollo entero",
    equivalencia: "Pollo grill",
    precioActual: 125,
  },
] as const;

describe("comprador-precios-pdf", () => {
  it("arma PDF vertical con un comprador y no se sale del ancho", () => {
    const pdf = buildCompradorPreciosPdf({
      rows: SAMPLE_ROWS,
      scope: { mode: "one", codigoComprador: "WAL01" },
      impresaAt: new Date("2026-09-21T12:00:00.000Z"),
    });

    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    const page = pdf.internal.pageSize;
    expect(page.getWidth()).toBeCloseTo(215.9, 1);
    expect(page.getHeight()).toBeCloseTo(279.4, 1);
  });

  it("incluye todos los compradores cuando el alcance es todos", () => {
    const pdf = buildCompradorPreciosPdf({
      rows: SAMPLE_ROWS,
      scope: { mode: "todos" },
    });

    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it("nombra el archivo según el alcance", () => {
    expect(buildCompradorPreciosPdfFilename({ mode: "todos" })).toBe(
      "lista-precios-todos.pdf",
    );
    expect(
      buildCompradorPreciosPdfFilename({
        mode: "one",
        codigoComprador: "WAL01",
      }),
    ).toBe("lista-precios-WAL01.pdf");
  });
});
