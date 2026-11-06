import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  anchosDeColumnas,
  MAX_FILAS_POR_HOJA,
  MAX_HOJAS_EXCEL,
  pdfDeExcel,
  tablaDeHoja,
} from "./excel-a-pdf";

function libro(hojas: Record<string, unknown[][]>, formato: "xlsx" | "xls" = "xlsx"): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  for (const [nombre, filas] of Object.entries(hojas)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filas), nombre);
  }
  const bytes = XLSX.write(wb, { type: "array", bookType: formato }) as ArrayBuffer;
  return bytes;
}

async function paginas(pdf: Uint8Array): Promise<number> {
  return (await PDFDocument.load(pdf)).getPageCount();
}

describe("tablaDeHoja", () => {
  it("quita filas y columnas vacías de los bordes", () => {
    const wb = XLSX.utils.aoa_to_sheet([
      ["", "", ""],
      ["Producto", "Cantidad", ""],
      ["Aguacate", 10, ""],
      ["", "", ""],
    ]);

    const { tabla, recortada } = tablaDeHoja(wb);

    expect(tabla).toEqual([
      ["Producto", "Cantidad"],
      ["Aguacate", "10"],
    ]);
    expect(recortada).toBe(false);
  });

  it("recorta a las primeras filas y lo avisa", () => {
    const filas = Array.from({ length: MAX_FILAS_POR_HOJA + 50 }, (_, i) => [`Fila ${i}`, i]);

    const { tabla, recortada } = tablaDeHoja(XLSX.utils.aoa_to_sheet(filas));

    expect(tabla).toHaveLength(MAX_FILAS_POR_HOJA);
    expect(recortada).toBe(true);
  });

  it("acorta una celda larguísima en vez de dejarla desbordar", () => {
    const { tabla } = tablaDeHoja(XLSX.utils.aoa_to_sheet([["x".repeat(500)]]));

    expect(tabla[0]![0]!.length).toBeLessThanOrEqual(48);
    expect(tabla[0]![0]!.endsWith("…")).toBe(true);
  });
});

describe("anchosDeColumnas", () => {
  it("reparte el ancho de la página en proporción al texto de cada columna", () => {
    const anchos = anchosDeColumnas([["a", "bbbbbbbbbb"], ["a", "bbbbbbbbbb"]], 100);

    expect(anchos.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
    expect(anchos[1]!).toBeGreaterThan(anchos[0]!);
  });

  it("una tabla sin columnas no falla", () => {
    expect(anchosDeColumnas([], 100)).toEqual([]);
  });
});

describe("pdfDeExcel", () => {
  it("convierte un xlsx en un PDF válido con una página por cada hoja con datos", async () => {
    const pdf = pdfDeExcel(
      libro({ Pedido: [["Producto", "Cantidad"], ["Aguacate", 10]], Notas: [["Entregar por muelle 2"]] }),
      "pedido.xlsx",
    );

    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
    expect(await paginas(pdf)).toBe(2);
  });

  it("también lee el formato viejo (xls)", async () => {
    const pdf = pdfDeExcel(libro({ Hoja1: [["A", "B"], [1, 2]] }, "xls"), "viejo.xls");

    expect(await paginas(pdf)).toBe(1);
  });

  it("una hoja con muchas filas sigue en más páginas", async () => {
    const filas = Array.from({ length: 200 }, (_, i) => [`Producto ${i}`, i]);

    expect(await paginas(pdfDeExcel(libro({ Lista: filas }), "lista.xlsx"))).toBeGreaterThan(2);
  });

  it("no pasa del tope de hojas del libro", async () => {
    const hojas = Object.fromEntries(Array.from({ length: MAX_HOJAS_EXCEL + 3 }, (_, i) => [`H${i}`, [["dato", i]]]));

    expect(await paginas(pdfDeExcel(libro(hojas), "grande.xlsx"))).toBe(MAX_HOJAS_EXCEL);
  });

  it("salta las hojas vacías", async () => {
    const pdf = pdfDeExcel(libro({ Vacia: [[""]], Datos: [["x", "y"]] }), "mixto.xlsx");

    expect(await paginas(pdf)).toBe(1);
  });

  it("un libro sin ningún dato falla con un mensaje que nombra el archivo", () => {
    expect(() => pdfDeExcel(libro({ Vacia: [[""]] }), "vacio.xlsx")).toThrow("vacio.xlsx no tiene datos para imprimir.");
  });
});
