import { PDFDocument, PDFPage } from "pdf-lib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { etiquetaDeHoja, numerarBlobPdf, numerarHojasPdfLib } from "./numerar-hojas-pdf";

afterEach(() => vi.restoreAllMocks());

describe("etiquetaDeHoja", () => {
  it("dice el número y el total de hojas", () => {
    expect(etiquetaDeHoja(5, 56)).toBe("Hoja 5 de 56");
  });

  it("con el paquete partido dice de qué envío es la cuenta", () => {
    expect(etiquetaDeHoja(5, 20, "2/3")).toBe("Parte 2/3 · Hoja 5 de 20");
  });
});

describe("numerarHojasPdfLib", () => {
  async function pdfConPaginas(tamanos: Array<[number, number]>): Promise<PDFDocument> {
    const pdf = await PDFDocument.create();
    for (const [ancho, alto] of tamanos) pdf.addPage([ancho, alto]);
    return pdf;
  }

  it("escribe «Hoja N de M» en cada página y no cambia cuántas hay", async () => {
    const pdf = await pdfConPaginas([[612, 792], [612, 792], [792, 612]]);
    const texto = vi.spyOn(PDFPage.prototype, "drawText");

    await numerarHojasPdfLib(pdf);

    expect(texto.mock.calls.map((c) => c[0])).toEqual(["Hoja 1 de 3", "Hoja 2 de 3", "Hoja 3 de 3"]);
    expect(pdf.getPageCount()).toBe(3);
    expect((await PDFDocument.load(await pdf.save())).getPageCount()).toBe(3);
  });

  it("queda dentro de la página, arriba a la derecha, aunque cambie el tamaño", async () => {
    const pdf = await pdfConPaginas([[612, 792], [792, 612]]);
    const texto = vi.spyOn(PDFPage.prototype, "drawText");

    await numerarHojasPdfLib(pdf);

    for (const [i, [ancho, alto]] of [[612, 792], [792, 612]].entries()) {
      const { x, y } = texto.mock.calls[i]![1] as { x: number; y: number };
      expect(x).toBeGreaterThan(ancho! * 0.7);
      expect(x).toBeLessThan(ancho!);
      expect(y).toBeGreaterThan(alto! - 30);
      expect(y).toBeLessThan(alto!);
    }
  });

  it("con el paquete partido dice de qué envío es", async () => {
    const pdf = await pdfConPaginas([[612, 792]]);
    const texto = vi.spyOn(PDFPage.prototype, "drawText");

    await numerarHojasPdfLib(pdf, "2/3");

    expect(texto.mock.calls[0]![0]).toBe("Parte 2/3 · Hoja 1 de 1");
  });

  it("numerarBlobPdf numera un PDF ya armado y devuelve otro PDF con las mismas páginas", async () => {
    const original = await (await pdfConPaginas([[612, 792], [792, 612]])).save();
    const texto = vi.spyOn(PDFPage.prototype, "drawText");

    const numerado = await numerarBlobPdf(new Blob([original as BlobPart]), "1/2");

    expect(texto.mock.calls.map((c) => c[0])).toEqual(["Parte 1/2 · Hoja 1 de 2", "Parte 1/2 · Hoja 2 de 2"]);
    expect(numerado.type).toBe("application/pdf");
    expect((await PDFDocument.load(await numerado.arrayBuffer())).getPageCount()).toBe(2);
  });

  it("mide desde la caja de la página aunque no empiece en 0,0", async () => {
    const pdf = await pdfConPaginas([[612, 792]]);
    pdf.getPage(0).setMediaBox(100, 50, 612, 792);
    const texto = vi.spyOn(PDFPage.prototype, "drawText");

    await numerarHojasPdfLib(pdf);

    const { x, y } = texto.mock.calls[0]![1] as { x: number; y: number };
    expect(x).toBeGreaterThan(100 + 612 * 0.7);
    expect(y).toBeGreaterThan(50 + 792 - 30);
  });
});
