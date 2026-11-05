import { jsPDF } from "jspdf";

/** Una OV del paquete, en el orden en que salen sus hojas. */
export interface FilaResumenImpresion {
  venta: string;
  cliente: string;
  /** `DD/MM/AAAA`; vacío si la OV no tiene fecha de entrega. */
  entrega: string;
  /** Cuántas OT de la OV van en el paquete. */
  ot: number;
  /** Cuáles OT van, ya escritas (ej. «1-3, 5»); si falta, la columna muestra solo la cantidad. */
  otLista?: string;
  /** Cuántas hojas ocupan esas OT (una OT con muchos renglones usa varias). */
  hojas: number;
  /** Páginas de OC (adjuntos HTML, PDF o Excel) que van detrás de las hojas de OT de la OV. */
  oc?: number;
  /**
   * En qué envío (desde 1) sale la OV, cuando el paquete se parte por su tamaño. Con más de una
   * parte el resumen añade la columna «Parte» y «Desde la hoja» cuenta dentro de cada parte.
   */
  parte?: number;
}

/** Lo que dice la portada: qué se imprime, desde cuándo y todo lo que lleva el PDF. */
export interface ResumenImpresionPdf {
  titulo: string;
  /** Ej. «Impresión rápida · entrega hasta 05/11/2026». */
  subtitulo: string;
  /** Ej. «Generado 05/11/2026 3:42 p. m.». */
  generado: string;
  filas: readonly FilaResumenImpresion[];
  /** Lo que no se pudo imprimir (una OC que no bajó, un archivo dañado…): una línea cada una. */
  notas?: readonly string[];
}

/** Letra carta vertical, igual que las hojas de orden de tarea. */
const PAGE_W = 215.9;
const PAGE_H = 279.4;
const MARGIN = 8;
const CONTENT_W = PAGE_W - MARGIN * 2;
const ENCABEZADO_H = 6.5;
const FILA_H = 6.4;
const NOTA_H = 5.2;
/** Con 6,4 mm por fila y el encabezado de la hoja caben 36 filas sin pasar el margen inferior. */
export const FILAS_POR_PAGINA_RESUMEN = 36;
/** Una nota por línea, a 5,2 mm: caben 45 bajo el título. */
export const NOTAS_POR_PAGINA_RESUMEN = 45;

type Alineacion = "left" | "center";
interface Columna {
  clave: string;
  ancho: number;
  alinea: Alineacion;
}

const COL_NUMERO: Columna = { clave: "#", ancho: 10, alinea: "center" };
const COL_OV: Columna = { clave: "Orden de venta", ancho: 30, alinea: "left" };
const COL_CLIENTE: Columna = { clave: "Cliente", ancho: 76, alinea: "left" };
const COL_ENTREGA: Columna = { clave: "Entrega", ancho: 24, alinea: "center" };
const COL_OT: Columna = { clave: "OT", ancho: 26, alinea: "center" };
const COL_HOJAS: Columna = { clave: "Hojas", ancho: 14, alinea: "center" };
const COL_OC: Columna = { clave: "OC", ancho: 12, alinea: "center" };
const COL_PARTE: Columna = { clave: "Parte", ancho: 12, alinea: "center" };
const COL_DESDE: Columna = { clave: "Desde la hoja", ancho: 24, alinea: "center" };

/** Las columnas «OC» y «Parte» solo aparecen si hacen falta; el ancho sale del cliente, que es el que más sobra. */
function columnasDe(conOc: boolean, conParte: boolean): Columna[] {
  const extra = (conOc ? COL_OC.ancho : 0) + (conParte ? COL_PARTE.ancho : 0);
  const columnas = [
    COL_NUMERO,
    COL_OV,
    { ...COL_CLIENTE, ancho: COL_CLIENTE.ancho - extra },
    COL_ENTREGA,
    COL_OT,
    COL_HOJAS,
    ...(conOc ? [COL_OC] : []),
    ...(conParte ? [COL_PARTE] : []),
    COL_DESDE,
  ];
  const escala = CONTENT_W / columnas.reduce((suma, col) => suma + col.ancho, 0);
  return columnas.map((col) => ({ ...col, ancho: col.ancho * escala }));
}

/**
 * Hoja (dentro de su parte) en que arranca cada OV. La primera parte lleva delante las hojas del
 * resumen; las demás empiezan en la 1. Cada OV ocupa sus hojas de OT y las páginas de sus OC.
 */
function hojasIniciales(filas: readonly FilaResumenImpresion[], paginasResumen: number): number[] {
  const inicios: number[] = [];
  let parte = 0;
  let hoja = 1;
  for (const fila of filas) {
    const actual = fila.parte ?? 1;
    if (actual !== parte) {
      parte = actual;
      hoja = actual === 1 ? paginasResumen + 1 : 1;
    }
    inicios.push(hoja);
    hoja += fila.hojas + (fila.oc ?? 0);
  }
  return inicios;
}

function paginasDeTabla(filas: number): number {
  return Math.max(1, Math.ceil(filas / FILAS_POR_PAGINA_RESUMEN));
}

/**
 * Cuántas hojas ocupa la portada: una por cada 36 OV (siempre al menos una) y, si hay notas de lo
 * que no se pudo imprimir, una más por cada 45 notas.
 */
export function paginasDeResumen(filas: number, notas = 0): number {
  return paginasDeTabla(filas) + (notas > 0 ? Math.ceil(notas / NOTAS_POR_PAGINA_RESUMEN) : 0);
}

function textoQueCabe(doc: jsPDF, texto: string, ancho: number): string {
  const limpio = texto.trim() || "—";
  const [primera] = doc.splitTextToSize(limpio, ancho - 1.6) as string[];
  const linea = primera ?? limpio;
  return linea.length < limpio.length ? `${linea.replace(/\s+\S*$/, "")}…` : linea;
}

function encabezadoDePagina(doc: jsPDF, resumen: ResumenImpresionPdf, pagina: number, totalPaginas: number): void {
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(resumen.titulo, MARGIN, MARGIN + 2, { baseline: "top" });
  if (totalPaginas > 1) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Página ${pagina} de ${totalPaginas} del resumen`, PAGE_W - MARGIN, MARGIN + 3, {
      align: "right",
      baseline: "top",
    });
  }
}

function dibujarNotas(doc: jsPDF, resumen: ResumenImpresionPdf, paginaDeNotas: number): void {
  const notas = resumen.notas ?? [];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Lo que no se pudo imprimir", MARGIN, MARGIN + 12, { baseline: "top" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const desde = (paginaDeNotas - 1) * NOTAS_POR_PAGINA_RESUMEN;
  notas.slice(desde, desde + NOTAS_POR_PAGINA_RESUMEN).forEach((nota, indice) => {
    doc.text(textoQueCabe(doc, nota, CONTENT_W), MARGIN, MARGIN + 21 + indice * NOTA_H, { baseline: "top" });
  });
}

function dibujarPagina(
  doc: jsPDF,
  resumen: ResumenImpresionPdf,
  pagina: number,
  totalPaginas: number,
  paginasResumen: number,
): void {
  encabezadoDePagina(doc, resumen, pagina, totalPaginas);
  const paginasTabla = paginasDeTabla(resumen.filas.length);
  if (pagina > paginasTabla) {
    dibujarNotas(doc, resumen, pagina - paginasTabla);
    return;
  }

  const conOc = resumen.filas.some((fila) => (fila.oc ?? 0) > 0);
  const conParte = resumen.filas.some((fila) => (fila.parte ?? 1) > 1);
  const columnas = columnasDe(conOc, conParte);
  const inicios = hojasIniciales(resumen.filas, paginasResumen);
  const totalOv = resumen.filas.length;
  const totalOt = resumen.filas.reduce((suma, fila) => suma + fila.ot, 0);
  const totalHojas = resumen.filas.reduce((suma, fila) => suma + fila.hojas, 0);
  const totalOc = resumen.filas.reduce((suma, fila) => suma + (fila.oc ?? 0), 0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(resumen.subtitulo, MARGIN, MARGIN + 10, { baseline: "top" });
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text(resumen.generado, MARGIN, MARGIN + 15, { baseline: "top" });
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const deOc = totalOc > 0 ? ` · ${totalOc} ${totalOc === 1 ? "página" : "páginas"} de órdenes de compra` : "";
  doc.text(
    `${totalOv} ${totalOv === 1 ? "orden de venta" : "órdenes de venta"} · ${totalOt} OT · ${totalHojas} ${totalHojas === 1 ? "hoja" : "hojas"} de órdenes de tarea${deOc}`,
    MARGIN,
    MARGIN + 20,
    { baseline: "top" },
  );

  let cursorY = MARGIN + 27;
  doc.setDrawColor(0);
  doc.setLineWidth(0.35);
  doc.setFillColor(225, 225, 225);
  doc.rect(MARGIN, cursorY, CONTENT_W, ENCABEZADO_H, "FD");
  doc.setFontSize(6.5);
  let cursorX = MARGIN;
  for (const col of columnas) {
    const columnaX = col.alinea === "center" ? cursorX + col.ancho / 2 : cursorX + 1.2;
    doc.text(col.clave, columnaX, cursorY + ENCABEZADO_H / 2, { align: col.alinea, baseline: "middle" });
    cursorX += col.ancho;
  }
  cursorY += ENCABEZADO_H;

  const desde = (pagina - 1) * FILAS_POR_PAGINA_RESUMEN;
  const visibles = resumen.filas.slice(desde, desde + FILAS_POR_PAGINA_RESUMEN);

  visibles.forEach((fila, indice) => {
    if (indice % 2 === 1) {
      doc.setFillColor(238, 238, 238);
      doc.rect(MARGIN, cursorY, CONTENT_W, FILA_H, "F");
    }
    doc.rect(MARGIN, cursorY, CONTENT_W, FILA_H, "S");
    const valores = [
      String(desde + indice + 1),
      fila.venta,
      fila.cliente,
      fila.entrega,
      fila.otLista ?? String(fila.ot),
      String(fila.hojas),
      ...(conOc ? [fila.oc ? String(fila.oc) : "—"] : []),
      ...(conParte ? [String(fila.parte ?? 1)] : []),
      String(inicios[desde + indice]),
    ];
    let columnaX = MARGIN;
    columnas.forEach((col, i) => {
      doc.setFont("helvetica", i === 1 ? "bold" : "normal");
      doc.setFontSize(7.5);
      const texto = textoQueCabe(doc, valores[i]!, col.ancho);
      const posicionTexto = col.alinea === "center" ? columnaX + col.ancho / 2 : columnaX + 1.2;
      doc.text(texto, posicionTexto, cursorY + FILA_H / 2, { align: col.alinea, baseline: "middle" });
      columnaX += col.ancho;
      if (i < columnas.length - 1) doc.line(columnaX, cursorY, columnaX, cursorY + FILA_H);
    });
    cursorY += FILA_H;
  });
}

function totalDePaginas(resumen: ResumenImpresionPdf): number {
  return paginasDeResumen(resumen.filas.length, resumen.notas?.length ?? 0);
}

/**
 * Pone el resumen como primeras hojas del PDF (una por cada 36 OV). Las hojas de orden de tarea
 * quedan detrás, intactas y en el mismo orden; «Desde la hoja» cuenta ya las del resumen.
 */
export function anadirResumenAlPdf(pdf: jsPDF, resumen: ResumenImpresionPdf): void {
  const paginas = totalDePaginas(resumen);
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    pdf.insertPage(pagina);
    pdf.setPage(pagina);
    dibujarPagina(pdf, resumen, pagina, paginas, paginas);
  }
}

/** Solo las hojas del resumen, como un PDF aparte: para ponerlas delante al armar el paquete. */
export function construirPdfResumen(resumen: ResumenImpresionPdf): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: [PAGE_W, PAGE_H], compress: true });
  const paginas = totalDePaginas(resumen);
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    if (pagina > 1) doc.addPage([PAGE_W, PAGE_H], "portrait");
    dibujarPagina(doc, resumen, pagina, paginas, paginas);
  }
  return new Uint8Array(doc.output("arraybuffer"));
}
