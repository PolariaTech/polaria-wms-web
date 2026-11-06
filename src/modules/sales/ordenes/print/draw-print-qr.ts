import type { jsPDF } from "jspdf";

/** Dibuja el QR de captura (o caja de respaldo) en la hoja de almacén. */
export function drawPrintQr(
  doc: jsPDF,
  qrDataUrl: string | null | undefined,
  x: number,
  y: number,
  size: number,
) {
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", x, y, size, size);
      return;
    } catch {
      /* fallback abajo */
    }
  }
  doc.setDrawColor(0);
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.rect(x, y, size, size, "S");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("QR", x + size / 2, y + size / 2, {
    align: "center",
    baseline: "middle",
  });
}
