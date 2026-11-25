import type { jsPDF } from "jspdf";
import { campoSurtidoExact } from "../surtido/apply-surtido-to-print";
import { drawPrintQr } from "./draw-print-qr";
import {
  PORTRAIT_CONTENT_W,
  PORTRAIT_MARGIN,
  portraitField,
  portraitSplitField,
} from "./draw-portrait-orden-pdf-layout";
import { portraitDrawNotesLines } from "./draw-portrait-orden-pdf-notes";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

const QR_SIZE = 28;
const QR_GAP = 2.5;

export function portraitDrawOrdenHeader(
  doc: jsPDF,
  data: OrdenTareaAlmacenPrintData,
  startY: number,
): number {
  const gridW = PORTRAIT_CONTENT_W - QR_SIZE - QR_GAP;
  const col = gridW / 3;
  const rowH = 11;
  const denomH = 8;
  const addrH = 12;
  let y = startY;

  const folio = data.folio || "—";
  const isActualizado = Boolean(data.surtido);
  const factura = campoSurtidoExact(
    data.surtido,
    "facturaAsociada",
    "Folio factura asociada",
    "Factura asociada",
  );

  const ordenTrabajo =
    data.ordenTrabajo ||
    `${data.tareaIndex && data.tareaIndex > 0 ? data.tareaIndex : 1}/${data.tareaTotal && data.tareaTotal > 0 ? data.tareaTotal : 1}`;

  portraitField(doc, PORTRAIT_MARGIN, y, col, rowH, "Orden de venta", folio);
  if (isActualizado) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("Actualizada", PORTRAIT_MARGIN + col - 1.6, y + 1.4, {
      align: "right",
      baseline: "top",
    });
  }
  portraitField(
    doc,
    PORTRAIT_MARGIN + col,
    y,
    col,
    rowH,
    "Orden de trabajo",
    ordenTrabajo,
  );
  portraitField(
    doc,
    PORTRAIT_MARGIN + col * 2,
    y,
    col,
    rowH,
    "Folio factura asociada",
    factura,
    true,
  );

  const qrX = PORTRAIT_MARGIN + gridW + QR_GAP;
  drawPrintQr(doc, data.qrDataUrl, qrX, y, QR_SIZE);
  y += rowH;

  portraitField(
    doc,
    PORTRAIT_MARGIN,
    y,
    col * 2,
    rowH,
    "# de orden del cliente",
    data.numeroOrdenCliente,
  );
  y += rowH;

  portraitField(
    doc,
    PORTRAIT_MARGIN,
    y,
    col,
    rowH,
    "Cliente: Razón Social",
    data.cliente,
  );
  portraitField(
    doc,
    PORTRAIT_MARGIN + col,
    y,
    col,
    rowH,
    "Centro de consumo",
    data.centroConsumo,
  );
  portraitSplitField(
    doc,
    PORTRAIT_MARGIN + col * 2,
    y,
    col,
    rowH,
    { label: "Fecha de entrega", value: data.fechaEntrega },
    { label: "Hora de entrega", value: data.horaEntrega },
  );
  y += rowH;

  portraitField(
    doc,
    PORTRAIT_MARGIN,
    y,
    col * 2,
    denomH,
    "Cliente: Denominación Comercial",
    data.clienteDenominacionComercial ?? "",
  );
  y += denomH;

  portraitField(
    doc,
    PORTRAIT_MARGIN,
    y,
    gridW,
    addrH,
    "Dirección de entrega",
    data.direccionEntrega,
  );
  y += addrH + 2;
  y = portraitDrawNotesLines(doc, y, "", data.notasGenerales, 3);
  return y + 2;
}