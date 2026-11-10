import { jsPDF } from "jspdf";
import { ROUTES } from "@/config/routes";
import { drawPrintQr } from "@/modules/sales/ordenes/print/draw-print-qr";

const ANCHO = 215.9;
const ALTO = 279.4;
const MARGEN = 14;
const QR = 150;

export function urlDespachoConCuenta(origin: string, codigoCuenta: string): string {
  const base = origin.replace(/\/+$/, "");
  const cuenta = codigoCuenta.trim();
  return `${base}${ROUTES.despachoPublico}?cuenta=${encodeURIComponent(cuenta)}`;
}

export function formatearFechaDespacho(
  fecha: Date,
  timeZone = "America/Mexico_City",
): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(fecha);
}

/** Carta vertical: fecha a la izquierda, DESPACHOS a la derecha, QR al centro. */
export function medidasHojaDespachoQr() {
  return {
    ancho: ANCHO,
    alto: ALTO,
    fecha: { x: MARGEN, y: 18 },
    titulo: { x: ANCHO - MARGEN, y: 18 },
    qr: { x: (ANCHO - QR) / 2, y: (ALTO - QR) / 2 + 8, size: QR },
  };
}

export function renderDespachoQrPdf(input: {
  fecha: string;
  qrDataUrl: string;
}): jsPDF {
  const medidas = medidasHojaDespachoQr();
  const doc = new jsPDF({
    unit: "mm",
    format: [medidas.ancho, medidas.alto],
    compress: true,
  });
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(input.fecha, medidas.fecha.x, medidas.fecha.y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("DESPACHOS", medidas.titulo.x, medidas.titulo.y, { align: "right" });
  drawPrintQr(doc, input.qrDataUrl, medidas.qr.x, medidas.qr.y, medidas.qr.size);
  return doc;
}
