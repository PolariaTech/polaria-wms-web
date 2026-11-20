import { jsPDF } from "jspdf";
import type { PartidaPrefactura, PrefacturaDocumento } from "./prefactura-documento";
import type { LogoPrefactura } from "./cargar-empresa-prefactura";

const ANCHO = 215.9;
const ALTO = 279.4;
const M = 10;
const CONTENIDO = ANCHO - M * 2;

const COLUMNAS: { titulo: string; ancho: number; clave: keyof PartidaPrefactura }[] = [
  { titulo: "Cantidad", ancho: 22, clave: "cantidad" },
  { titulo: "Unidad", ancho: 22, clave: "unidad" },
  { titulo: "Descripción", ancho: 90, clave: "descripcion" },
  { titulo: "Valor unitario", ancho: 32, clave: "valorUnitario" },
  { titulo: "Importe", ancho: 29.9, clave: "importe" },
];

function logoDataUrl(logo: LogoPrefactura): string {
  let binario = "";
  for (const byte of logo.bytes) binario += String.fromCharCode(byte);
  const mime = logo.formato === "PNG" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${btoa(binario)}`;
}

function campo(doc: jsPDF, x: number, y: number, etiqueta: string, valor: string, ancho: number): void {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(40);
  doc.text(etiqueta, x, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0);
  const visible = valor.trim() || "—";
  const linea = doc.splitTextToSize(visible, ancho)[0] ?? "—";
  doc.text(String(linea), x, y + 3.6);
}

function franja(doc: jsPDF, y: number, titulo: string): number {
  doc.setFillColor(232, 232, 232);
  doc.rect(M, y, CONTENIDO, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text(titulo, M + 2, y + 4.1);
  return y + 8;
}

function colocarLogo(doc: jsPDF, prefactura: PrefacturaDocumento): void {
  if (!prefactura.logo) return;
  try {
    doc.addImage(logoDataUrl(prefactura.logo), prefactura.logo.formato, M, 8, 24, 24);
  } catch (error) {
    const detalle = error instanceof Error ? error.message : "imagen ilegible";
    throw new Error(`No se pudo colocar el logo en la prefactura. ${detalle}`);
  }
}

function dibujarEmisor(doc: jsPDF, prefactura: PrefacturaDocumento): number {
  colocarLogo(doc, prefactura);
  const x = prefactura.logo ? M + 28 : M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PREFACTURA", x, 12);
  doc.setFontSize(8);
  doc.text("Tipo de comprobante: I - Ingreso", x, 16.5);
  doc.setFontSize(13);
  doc.text(prefactura.razonSocial, x, 23);
  campo(doc, M, 36, "RFC", prefactura.rfc, 55);
  campo(doc, M + 60, 36, "Serie", prefactura.serie, 30);
  campo(doc, M + 95, 36, "Folio", prefactura.folio, 40);
  campo(doc, M + 140, 36, "Fecha", prefactura.fecha, 45);
  campo(doc, M, 46, "Régimen fiscal", prefactura.regimen, 120);
  campo(doc, M + 125, 46, "Lugar de expedición (C.P.)", prefactura.codigoPostal, 60);
  return 56;
}

function dibujarReceptor(doc: jsPDF, prefactura: PrefacturaDocumento, y: number): number {
  const siguiente = franja(doc, y, "Receptor");
  campo(doc, M, siguiente, "Cliente", prefactura.cliente, 100);
  campo(doc, M + 105, siguiente, "RFC", prefactura.rfcCliente, 80);
  campo(doc, M, siguiente + 10, "Domicilio", prefactura.domicilio, 100);
  campo(doc, M + 105, siguiente + 10, "Moneda", prefactura.moneda, 80);
  campo(doc, M, siguiente + 20, "Referencia", prefactura.referencia, 100);
  campo(doc, M + 105, siguiente + 20, "Realizó", prefactura.realizo, 80);
  return siguiente + 28;
}

function encabezadoPartidas(doc: jsPDF, y: number): number {
  doc.setFillColor(20, 20, 20);
  doc.rect(M, y, CONTENIDO, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255);
  let x = M + 1.5;
  for (const columna of COLUMNAS) {
    doc.text(columna.titulo, x, y + 4);
    x += columna.ancho;
  }
  doc.setTextColor(0);
  return y + 8;
}

function filaPartida(doc: jsPDF, y: number, partida: PartidaPrefactura): void {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let x = M + 1.5;
  for (const columna of COLUMNAS) {
    const linea = doc.splitTextToSize(partida[columna.clave], columna.ancho - 2)[0] ?? "";
    doc.text(String(linea), x, y);
    x += columna.ancho;
  }
}

function dibujarPartidas(doc: jsPDF, prefactura: PrefacturaDocumento, yInicial: number): number {
  let y = franja(doc, yInicial, "Partidas");
  y = encabezadoPartidas(doc, y);
  for (const partida of prefactura.partidas) {
    if (y > ALTO - 55) {
      doc.addPage();
      y = encabezadoPartidas(doc, 12);
    }
    filaPartida(doc, y, partida);
    y += 6;
  }
  return y + 2;
}

function dibujarCierre(doc: jsPDF, prefactura: PrefacturaDocumento, yInicial: number): void {
  let y = yInicial > ALTO - 70 ? (doc.addPage(), 12) : yInicial;
  const derechos = [
    ["Subtotal", prefactura.subtotal],
    ["Descuentos", "$0.00"],
    ["Impuestos trasladados", "$0.00"],
    ["Total", prefactura.total],
  ] as const;
  doc.setFontSize(8);
  for (const [etiqueta, valor] of derechos) {
    doc.setFont("helvetica", etiqueta === "Total" ? "bold" : "normal");
    doc.text(etiqueta, ANCHO - M - 70, y);
    doc.text(valor, ANCHO - M, y, { align: "right" });
    y += 5;
  }
  doc.setFont("helvetica", "bold");
  doc.text("Total con letra", M, y);
  doc.setFont("helvetica", "normal");
  doc.text(prefactura.totalLetra, M, y + 4);
  y = franja(doc, y + 8, "Cuenta de la empresa");
  campo(doc, M, y, "Cuenta", prefactura.cuenta, 90);
  campo(doc, M + 95, y, "Banco", prefactura.banco, 90);
  campo(doc, M, y + 10, "CLABE", prefactura.clabe, 90);
  campo(doc, M + 95, y + 10, "Correo", prefactura.correo, 90);
  doc.setFontSize(7);
  doc.text("Prefactura sin timbre fiscal. No es un CFDI.", M, ALTO - 8);
}

function dibujarUna(doc: jsPDF, prefactura: PrefacturaDocumento): void {
  const trasReceptor = dibujarReceptor(doc, prefactura, dibujarEmisor(doc, prefactura));
  dibujarCierre(doc, prefactura, dibujarPartidas(doc, prefactura, trasReceptor));
}

/** Una hoja (o más, si hay muchas partidas) por prefactura, tamaño carta. */
export function renderPrefacturasPdf(documentos: readonly PrefacturaDocumento[]): jsPDF {
  if (documentos.length === 0) throw new Error("No hay prefacturas para imprimir.");
  const doc = new jsPDF({ unit: "mm", format: [ANCHO, ALTO], compress: true });
  documentos.forEach((prefactura, indice) => {
    if (indice > 0) doc.addPage();
    dibujarUna(doc, prefactura);
  });
  return doc;
}
