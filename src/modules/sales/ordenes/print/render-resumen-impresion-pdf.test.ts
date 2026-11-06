import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  anadirResumenAlPdf,
  construirPdfResumen,
  NOTAS_POR_PAGINA_RESUMEN,
  FILAS_POR_PAGINA_RESUMEN,
  paginasDeResumen,
  type FilaResumenImpresion,
  type ResumenImpresionPdf,
} from "./render-resumen-impresion-pdf";

function fila(n: number, extra: Partial<FilaResumenImpresion> = {}): FilaResumenImpresion {
  return { venta: `OV-${n}`, cliente: `Cliente ${n}`, entrega: "05/11/2026", ot: 1, hojas: 1, ...extra };
}

function resumen(filas: FilaResumenImpresion[]): ResumenImpresionPdf {
  return {
    titulo: "Resumen de impresión",
    subtitulo: "Impresión rápida · entrega hasta 05/11/2026",
    generado: "Generado 05/11/2026 3:42 p. m.",
    filas,
  };
}

/** PDF de dos hojas de «orden de tarea» marcadas, para ver que el resumen no las desordena. */
function pdfConDosHojas(): jsPDF {
  const pdf = new jsPDF({ unit: "mm", format: [215.9, 279.4] });
  pdf.text("HOJA-A", 10, 10);
  pdf.addPage();
  pdf.text("HOJA-B", 10, 10);
  return pdf;
}

const contenido = (pdf: jsPDF, pagina: number): string =>
  (pdf.internal as unknown as { pages: string[][] }).pages[pagina]!.join("\n");

describe("columna OT del resumen", () => {
  it("escribe cuáles OT van de cada OV cuando la fila las trae, y solo la cantidad si no", () => {
    const pdf = pdfConDosHojas();
    anadirResumenAlPdf(pdf, resumen([fila(1, { ot: 4, otLista: "1-3, 5", hojas: 4 }), fila(2, { ot: 2 })]));

    const texto = contenido(pdf, 1);
    expect(texto).toContain("(1-3, 5) Tj");
    expect(texto).toContain("(2) Tj");
  });
});

describe("paginasDeResumen", () => {
  it("siempre ocupa al menos una hoja y suma otra por cada 36 OV", () => {
    expect(paginasDeResumen(0)).toBe(1);
    expect(paginasDeResumen(1)).toBe(1);
    expect(paginasDeResumen(FILAS_POR_PAGINA_RESUMEN)).toBe(1);
    expect(paginasDeResumen(FILAS_POR_PAGINA_RESUMEN + 1)).toBe(2);
    expect(paginasDeResumen(100)).toBe(3);
  });
});

describe("anadirResumenAlPdf", () => {
  it("pone el resumen de primera hoja y deja las demás intactas y en orden", () => {
    const pdf = pdfConDosHojas();

    anadirResumenAlPdf(pdf, resumen([fila(1), fila(2)]));

    expect(pdf.getNumberOfPages()).toBe(3);
    expect(contenido(pdf, 1)).toContain("Resumen de impresi");
    expect(contenido(pdf, 1)).not.toContain("HOJA-");
    expect(contenido(pdf, 2)).toContain("HOJA-A");
    expect(contenido(pdf, 3)).toContain("HOJA-B");
  });

  it("lista cada OV con su cliente, y los totales", () => {
    const pdf = pdfConDosHojas();

    anadirResumenAlPdf(pdf, resumen([fila(1, { ot: 2, hojas: 3 }), fila(2, { cliente: "Hotel Luna" })]));

    const primera = contenido(pdf, 1);
    expect(primera).toContain("OV-1");
    expect(primera).toContain("OV-2");
    expect(primera).toContain("Hotel Luna");
    expect(primera).toContain("denes de venta");
    expect(primera).toContain("2 ");
    expect(primera).toContain("3 OT");
    expect(primera).toContain("4 hojas");
  });

  it("«Desde la hoja» cuenta la hoja del resumen: la primera OV arranca en la 2", () => {
    const pdf = pdfConDosHojas();

    anadirResumenAlPdf(pdf, resumen([fila(1, { hojas: 3 }), fila(2)]));

    const textos = [...contenido(pdf, 1).matchAll(/\((\d+)\) Tj/g)].map((m) => m[1]);
    // Por fila: n, ot, hojas, desde. Fila 1 → «2» y fila 2 → «5» (2 + 3 hojas de la primera).
    expect(textos).toContain("5");
    expect(textos.filter((t) => t === "2").length).toBeGreaterThanOrEqual(2);
  });

  it("con más de 36 OV reparte el resumen en varias hojas y las demás siguen detrás", () => {
    const pdf = pdfConDosHojas();
    const muchas = Array.from({ length: FILAS_POR_PAGINA_RESUMEN + 4 }, (_, i) => fila(i + 1));

    anadirResumenAlPdf(pdf, resumen(muchas));

    expect(pdf.getNumberOfPages()).toBe(4);
    expect(contenido(pdf, 1)).toContain("OV-1)");
    expect(contenido(pdf, 1)).not.toContain(`OV-${FILAS_POR_PAGINA_RESUMEN + 1})`);
    expect(contenido(pdf, 2)).toContain(`OV-${FILAS_POR_PAGINA_RESUMEN + 1})`);
    expect(contenido(pdf, 1)).toContain("gina 1 de 2 del resumen");
    expect(contenido(pdf, 3)).toContain("HOJA-A");
    expect(contenido(pdf, 4)).toContain("HOJA-B");
  });

  it("con el paquete partido añade la columna «Parte» y cuenta las hojas dentro de cada parte", () => {
    const pdf = pdfConDosHojas();

    anadirResumenAlPdf(pdf, resumen([
      fila(1, { hojas: 3, parte: 1 }),
      fila(2, { hojas: 2, parte: 1 }),
      fila(3, { hojas: 1, parte: 2 }),
    ]));

    const primera = contenido(pdf, 1);
    expect(primera).toContain("(Parte) Tj");
    const textos = [...primera.matchAll(/\((\d+)\) Tj/g)].map((m) => m[1]);
    // «Desde la hoja»: OV 1 en la 2 (tras la portada), OV 2 en la 5; la OV 3 abre la parte 2, así que es la hoja 1.
    expect(textos).toEqual(expect.arrayContaining(["2", "5", "1"]));
  });

  it("sin partes no aparece la columna «Parte»", () => {
    const pdf = pdfConDosHojas();

    anadirResumenAlPdf(pdf, resumen([fila(1), fila(2)]));

    expect(contenido(pdf, 1)).not.toContain("(Parte) Tj");
  });

  it("recorta un cliente demasiado largo en vez de salirse de la columna", () => {
    const pdf = pdfConDosHojas();

    anadirResumenAlPdf(pdf, resumen([fila(1, { cliente: "Comercializadora Internacional de Alimentos Frescos y Congelados del Caribe Sociedad Anonima" })]));

    expect(contenido(pdf, 1)).toContain("Comercializadora");
    expect(contenido(pdf, 1)).not.toContain("Anonima");
  });

  it("con OC añade la columna «OC» y «Desde la hoja» cuenta sus páginas", () => {
    const pdf = pdfConDosHojas();

    // Portada de 1 página: la OV A arranca en la 2, ocupa 1 hoja de OT + 3 de OC, y la OV B en la 6.
    anadirResumenAlPdf(pdf, resumen([fila(1, { hojas: 1, oc: 3 }), fila(2, { hojas: 1 })]));

    const primera = contenido(pdf, 1);
    expect(primera).toContain("(OC) Tj");
    const textos = [...primera.matchAll(/\((\d+|—)\) Tj/g)].map((m) => m[1]);
    expect(textos).toEqual(expect.arrayContaining(["2", "6", "3"]));
    expect(primera).toContain("3 p");
  });

  it("sin OC no aparece la columna «OC»", () => {
    const pdf = pdfConDosHojas();

    anadirResumenAlPdf(pdf, resumen([fila(1), fila(2)]));

    expect(contenido(pdf, 1)).not.toContain("(OC) Tj");
  });

  it("las notas de lo que no se pudo imprimir van en una hoja aparte, detrás de la tabla", () => {
    const pdf = pdfConDosHojas();

    anadirResumenAlPdf(pdf, { ...resumen([fila(1)]), notas: ["OV-1: pedido.pdf: el servidor respondio 404."] });

    // Tabla (1) + notas (1) + las dos hojas que ya tenía el PDF.
    expect(pdf.getNumberOfPages()).toBe(4);
    expect(contenido(pdf, 1)).not.toContain("Lo que no se pudo imprimir");
    expect(contenido(pdf, 2)).toContain("Lo que no se pudo imprimir");
    expect(contenido(pdf, 2)).toContain("pedido.pdf");
    // La primera hoja de OT arranca después de las dos del resumen.
    expect(contenido(pdf, 3)).toContain("HOJA-A");
  });

  it("«Desde la hoja» también cuenta la hoja de notas", () => {
    const pdf = pdfConDosHojas();

    anadirResumenAlPdf(pdf, { ...resumen([fila(1, { hojas: 2 })]), notas: ["una nota"] });

    const textos = [...contenido(pdf, 1).matchAll(/\((\d+)\) Tj/g)].map((m) => m[1]);
    // Resumen de 2 páginas (tabla y notas): la primera OV arranca en la hoja 3.
    expect(textos).toContain("3");
  });
});

describe("paginasDeResumen con notas", () => {
  it("las notas suman una hoja por cada 45", () => {
    expect(paginasDeResumen(2, 0)).toBe(1);
    expect(paginasDeResumen(2, 1)).toBe(2);
    expect(paginasDeResumen(2, NOTAS_POR_PAGINA_RESUMEN)).toBe(2);
    expect(paginasDeResumen(2, NOTAS_POR_PAGINA_RESUMEN + 1)).toBe(3);
    expect(paginasDeResumen(FILAS_POR_PAGINA_RESUMEN + 1, 1)).toBe(3);
  });
});

describe("construirPdfResumen", () => {
  it("devuelve un PDF con solo las hojas del resumen", async () => {
    const pdf = construirPdfResumen({ ...resumen([fila(1), fila(2)]), notas: ["una nota"] });

    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
    expect((await PDFDocument.load(pdf)).getPageCount()).toBe(paginasDeResumen(2, 1));
  });

  it("con muchas OV ocupa varias hojas y el número coincide con el que se cuenta para el paquete", async () => {
    const muchas = Array.from({ length: FILAS_POR_PAGINA_RESUMEN + 4 }, (_, i) => fila(i + 1));

    const pdf = construirPdfResumen(resumen(muchas));

    expect((await PDFDocument.load(pdf)).getPageCount()).toBe(paginasDeResumen(muchas.length));
  });
});
