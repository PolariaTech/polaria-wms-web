import { jsPDF } from "jspdf";
import { drawPrintQr } from "@/modules/sales/ordenes/print/draw-print-qr";
import type { PartidaPrefactura, PrefacturaDocumento } from "./prefactura-documento";
import type { LogoPrefactura } from "./cargar-empresa-prefactura";

const ANCHO = 215.9;
const ALTO = 279.4;
const M = 10;
const CONTENIDO = ANCHO - M * 2;
const ANCHO_LOGO = 56;
const ALTO_LOGO = 24;
const X_DATOS = 136;
const QR_LADO = 16;
const QR_X = ANCHO - M - QR_LADO;
const QR_Y = 14;
const VERDE_ENCABEZADO_PARTIDAS = [171, 206, 106] as const;

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

function medida(bytes: Uint8Array, offset: number, largo: 2 | 4): number {
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return largo === 4 ? vista.getUint32(offset) : vista.getUint16(offset);
}

function pixelesPng(bytes: Uint8Array): { ancho: number; alto: number } | null {
  if (bytes.length < 24 || bytes[0] !== 0x89) return null;
  const ancho = medida(bytes, 16, 4);
  const alto = medida(bytes, 20, 4);
  return ancho > 0 && alto > 0 ? { ancho, alto } : null;
}

function pixelesJpeg(bytes: Uint8Array): { ancho: number; alto: number } | null {
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marca = bytes[i + 1];
    if (marca === 0xc0 || marca === 0xc1 || marca === 0xc2) {
      const alto = medida(bytes, i + 5, 2);
      const ancho = medida(bytes, i + 7, 2);
      return ancho > 0 && alto > 0 ? { ancho, alto } : null;
    }
    const largo = (bytes[i + 2] << 8) | bytes[i + 3];
    if (largo < 2) return null;
    i += 2 + largo;
  }
  return null;
}

/** Alto fijo de 24 mm; el ancho sigue la proporción de la imagen para no aplastar el logo. */
export function cajaDelLogo(logo: LogoPrefactura): { ancho: number; alto: number } {
  const pixeles = logo.formato === "PNG" ? pixelesPng(logo.bytes) : pixelesJpeg(logo.bytes);
  const relacion = pixeles ? pixeles.ancho / pixeles.alto : ANCHO_LOGO / ALTO_LOGO;
  const alto = Math.min(ALTO_LOGO, ANCHO_LOGO / relacion);
  return { ancho: Math.round(alto * relacion * 10) / 10, alto: Math.round(alto * 10) / 10 };
}

function enLinea(doc: jsPDF, x: number, y: number, etiqueta: string, valor: string, tope: number): void {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(40);
  doc.text(etiqueta, x, y);
  const inicio = x + doc.getTextWidth(etiqueta) + 1.6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  const visible = valor.trim() || "—";
  const linea = doc.splitTextToSize(visible, Math.max(8, tope - inicio))[0] ?? "—";
  doc.text(String(linea), inicio, y);
}

function colocarLogo(doc: jsPDF, prefactura: PrefacturaDocumento): number {
  if (!prefactura.logo) return 0;
  const caja = cajaDelLogo(prefactura.logo);
  try {
    doc.addImage(logoDataUrl(prefactura.logo), prefactura.logo.formato, M, 8, caja.ancho, caja.alto);
  } catch (error) {
    const detalle = error instanceof Error ? error.message : "imagen ilegible";
    throw new Error(`No se pudo colocar el logo en la prefactura. ${detalle}`);
  }
  return caja.ancho;
}

function bloqueComprobante(doc: jsPDF, prefactura: PrefacturaDocumento): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text("PREFACTURA", X_DATOS, 12);
  enLinea(doc, X_DATOS, 18, "Tipo de comprobante", "I - Ingreso", ANCHO - M);
  const topeJuntoAlQr = prefactura.qrDataUrl ? QR_X - 2 : ANCHO - M;
  enLinea(doc, X_DATOS, 23.5, "Serie", prefactura.serie, topeJuntoAlQr);
  enLinea(doc, X_DATOS, 29, "Fecha", prefactura.fecha, topeJuntoAlQr);
  if (prefactura.qrDataUrl) drawPrintQr(doc, prefactura.qrDataUrl, QR_X, QR_Y, QR_LADO);
  const yFolio = QR_Y + QR_LADO + 4.5;
  enLinea(doc, X_DATOS, yFolio, "Folio", prefactura.folio, ANCHO - M);
  return yFolio;
}

function dibujarEmisor(doc: jsPDF, prefactura: PrefacturaDocumento): number {
  const anchoLogo = colocarLogo(doc, prefactura);
  const x = anchoLogo > 0 ? M + anchoLogo + 4 : M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0);
  const nombre = doc.splitTextToSize(prefactura.razonSocial, X_DATOS - x - 3)[0] ?? "";
  doc.text(String(nombre), x, 14);
  enLinea(doc, x, 20, "RFC", prefactura.rfc, X_DATOS - 3);
  enLinea(doc, x, 26, "Régimen fiscal", prefactura.regimen, X_DATOS - 3);
  return bloqueComprobante(doc, prefactura) + 6;
}

function dibujarReceptor(doc: jsPDF, prefactura: PrefacturaDocumento, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text("Receptor", M, y);
  const fila = y + 6;
  const paso = 5.2;
  enLinea(doc, M, fila, "Cliente", prefactura.cliente, X_DATOS - 4);
  enLinea(doc, M, fila + paso, "RFC", prefactura.rfcCliente, X_DATOS - 4);
  enLinea(doc, M, fila + paso * 2, "Régimen Fiscal", prefactura.regimenComprador, X_DATOS - 4);
  enLinea(doc, M, fila + paso * 3, "Domicilio Fiscal", prefactura.domicilioFiscal, X_DATOS - 4);
  enLinea(doc, M, fila + paso * 4, "Domicilio", prefactura.domicilio, X_DATOS - 4);
  enLinea(doc, X_DATOS, fila, "Lugar de expedición (C.P.)", prefactura.codigoPostal, ANCHO - M);
  enLinea(doc, X_DATOS, fila + paso, "Método de Pago", prefactura.metodoPago, ANCHO - M);
  enLinea(doc, X_DATOS, fila + paso * 2, "Forma de Pago", prefactura.formaPago, ANCHO - M);
  enLinea(doc, X_DATOS, fila + paso * 3, "Moneda", prefactura.moneda, ANCHO - M);
  enLinea(doc, X_DATOS, fila + paso * 4, "Referencia", prefactura.referencia, ANCHO - M);
  enLinea(doc, X_DATOS, fila + paso * 5, "Realizó", prefactura.realizo, ANCHO - M);
  enLinea(doc, M, fila + paso * 6, "Orden de tarea", prefactura.ordenTarea, ANCHO - M);
  return fila + paso * 6 + 6;
}

function encabezadoPartidas(doc: jsPDF, y: number): number {
  doc.setFillColor(...VERDE_ENCABEZADO_PARTIDAS);
  doc.rect(M, y, CONTENIDO, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(0);
  let x = M + 1.5;
  for (const columna of COLUMNAS) {
    doc.text(columna.titulo, x, y + 4);
    x += columna.ancho;
  }
  doc.setTextColor(0);
  return y + 10;
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

function numerarHojas(doc: jsPDF, desde: number): void {
  const hasta = doc.getNumberOfPages();
  for (let pagina = desde; pagina <= hasta; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0);
    doc.text(`Hoja ${pagina - desde + 1}`, ANCHO - M, ALTO - 8, { align: "right" });
  }
}

/** Una hoja (o más, si hay muchas partidas) por prefactura, tamaño carta. */
export function renderPrefacturasPdf(documentos: readonly PrefacturaDocumento[]): jsPDF {
  if (documentos.length === 0) throw new Error("No hay prefacturas para imprimir.");
  const doc = new jsPDF({ unit: "mm", format: [ANCHO, ALTO], compress: true });
  documentos.forEach((prefactura, indice) => {
    if (indice > 0) doc.addPage();
    const desde = doc.getNumberOfPages();
    dibujarUna(doc, prefactura);
    numerarHojas(doc, desde);
  });
  return doc;
}
