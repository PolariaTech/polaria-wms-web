import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

/** Para que un libro enorme no tumbe el navegador ni llene el paquete: se imprime lo primero. */
export const MAX_HOJAS_EXCEL = 5;
export const MAX_FILAS_POR_HOJA = 400;
const MAX_COLUMNAS = 20;
const MAX_CARACTERES_CELDA = 48;

/** Carta horizontal: las listas de pedido suelen ser anchas. */
const PAGE_W = 279.4;
const PAGE_H = 215.9;
const MARGIN = 8;
const FILA_H = 4.6;
const TITULO_H = 8;

type Tabla = string[][];

function textoCelda(valor: unknown): string {
  const texto = String(valor ?? "").replace(/\s+/g, " ").trim();
  return texto.length > MAX_CARACTERES_CELDA ? `${texto.slice(0, MAX_CARACTERES_CELDA - 1)}…` : texto;
}

/** Quita las filas y columnas vacías de los bordes y recorta a los topes. */
export function tablaDeHoja(hoja: XLSX.WorkSheet): { tabla: Tabla; recortada: boolean } {
  const filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: false, defval: "", blankrows: false });
  const conTexto = filas.map((fila) => fila.map(textoCelda));
  const noVacias = conTexto.filter((fila) => fila.some((celda) => celda !== ""));
  const columnas = Math.min(
    MAX_COLUMNAS,
    noVacias.reduce((mayor, fila) => {
      let ultima = fila.length;
      while (ultima > 0 && fila[ultima - 1] === "") ultima -= 1;
      return Math.max(mayor, ultima);
    }, 0),
  );
  const recortada = noVacias.length > MAX_FILAS_POR_HOJA;
  const tabla = noVacias
    .slice(0, MAX_FILAS_POR_HOJA)
    .map((fila) => Array.from({ length: columnas }, (_, i) => fila[i] ?? ""));
  return { tabla, recortada };
}

/** Ancho de cada columna, proporcional a su texto más largo, repartido en el ancho de la página. */
export function anchosDeColumnas(tabla: Tabla, anchoTotal: number): number[] {
  const columnas = tabla[0]?.length ?? 0;
  const pesos = Array.from({ length: columnas }, (_, c) =>
    Math.max(3, ...tabla.map((fila) => (fila[c] ?? "").length)),
  );
  const suma = pesos.reduce((a, b) => a + b, 0) || 1;
  return pesos.map((peso) => (peso / suma) * anchoTotal);
}

function dibujarHoja(doc: jsPDF, nombre: string, tabla: Tabla, recortada: boolean, primera: boolean): void {
  if (!primera) doc.addPage([PAGE_W, PAGE_H], "landscape");
  const anchoUtil = PAGE_W - MARGIN * 2;
  const anchos = anchosDeColumnas(tabla, anchoUtil);
  const tamano = anchos.length > 12 ? 5 : anchos.length > 8 ? 6 : 7;
  let y = MARGIN;

  const titulo = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(nombre, MARGIN, y + 3, { baseline: "top" });
    y += TITULO_H;
  };
  titulo();

  tabla.forEach((fila, indice) => {
    if (y + FILA_H > PAGE_H - MARGIN) {
      doc.addPage([PAGE_W, PAGE_H], "landscape");
      y = MARGIN;
      titulo();
    }
    if (indice % 2 === 1) {
      doc.setFillColor(238, 238, 238);
      doc.rect(MARGIN, y, anchoUtil, FILA_H, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(tamano);
    let x = MARGIN;
    fila.forEach((celda, c) => {
      const ancho = anchos[c] ?? 0;
      // Lo que no cabe en su columna se recorta: así una celda larga no pisa a la siguiente.
      const [linea] = doc.splitTextToSize(celda, Math.max(ancho - 1.2, 2)) as string[];
      if (linea) doc.text(linea, x + 0.6, y + FILA_H / 2, { baseline: "middle" });
      x += ancho;
    });
    y += FILA_H;
  });

  if (recortada) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6);
    doc.text(`Solo se imprimen las primeras ${MAX_FILAS_POR_HOJA} filas de esta hoja.`, MARGIN, y + 2, {
      baseline: "top",
    });
  }
}

/**
 * Pasa un Excel (xls, xlsx) a PDF: una tabla por hoja del libro, en carta horizontal. Es una
 * impresión para consulta, no una copia fiel: se pierden colores, combinaciones y fórmulas (se
 * imprime el valor que muestra la celda).
 */
export function pdfDeExcel(contenido: ArrayBuffer, nombreArchivo: string): Uint8Array {
  const libro = XLSX.read(contenido, { type: "array" });
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [PAGE_W, PAGE_H], compress: true });
  let dibujadas = 0;

  for (const nombreHoja of libro.SheetNames.slice(0, MAX_HOJAS_EXCEL)) {
    const hoja = libro.Sheets[nombreHoja];
    if (!hoja) continue;
    const { tabla, recortada } = tablaDeHoja(hoja);
    if (tabla.length === 0) continue;
    dibujarHoja(doc, `${nombreArchivo} · ${nombreHoja}`, tabla, recortada, dibujadas === 0);
    dibujadas += 1;
  }

  if (dibujadas === 0) throw new Error(`${nombreArchivo} no tiene datos para imprimir.`);
  return new Uint8Array(doc.output("arraybuffer"));
}
