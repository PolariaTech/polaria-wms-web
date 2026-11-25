import type { jsPDF } from "jspdf";
import { campoSurtido, campoSurtidoExact } from "../surtido/apply-surtido-to-print";
import { ORDEN_TAREA_ALMACEN_SIGNATURE_ROLES } from "./draw-orden-tarea-almacen-signature-roles";
import {
  LANDSCAPE_LEFT_W,
  LANDSCAPE_MARGIN,
  LANDSCAPE_PAGE_BOTTOM,
  landscapeBox,
  landscapeDrawNotesLines,
  landscapeField,
  landscapeSplitField,
} from "./draw-landscape-orden-pdf-layout";
import { drawPrintQr } from "./draw-print-qr";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

const QR_SIZE = 26;

export function landscapeDrawLeftPanel(
  doc: jsPDF,
  data: OrdenTareaAlmacenPrintData,
): number {
  const folio = data.folio || "—";
  const isActualizado = Boolean(data.surtido);
  const factura = campoSurtidoExact(
    data.surtido,
    "facturaAsociada",
    "Folio factura asociada",
    "Factura asociada",
  );

  const leftX = LANDSCAPE_MARGIN;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80);
  const tareaIndex =
    data.tareaIndex && data.tareaIndex > 0 ? data.tareaIndex : 1;
  const tareaTotal =
    data.tareaTotal && data.tareaTotal > 0 ? data.tareaTotal : 1;
  const ordenTrabajo = data.ordenTrabajo || `${tareaIndex}/${tareaTotal}`;
  doc.text(`Creada ${data.creada}  ·  Impresa ${data.impresa}`, LANDSCAPE_MARGIN, 4.5, {
    baseline: "top",
  });
  doc.setTextColor(0);

  let y = LANDSCAPE_MARGIN + 5;

  const qrTopX = leftX + (LANDSCAPE_LEFT_W - QR_SIZE) / 2;
  drawPrintQr(doc, data.qrDataUrl, qrTopX, y, QR_SIZE);
  y += QR_SIZE + 2;

  if (data.diaEntrega?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(data.diaEntrega.trim(), leftX + LANDSCAPE_LEFT_W / 2, y + 2, {
      align: "center",
      baseline: "top",
    });
    y += 10;
    doc.setFont("helvetica", "normal");
  }

  const rowH = 10;
  landscapeSplitField(
    doc,
    leftX,
    y,
    LANDSCAPE_LEFT_W,
    rowH,
    { label: "Orden de venta", value: folio },
    { label: "Orden de trabajo", value: ordenTrabajo },
  );
  if (isActualizado) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    doc.text("Actualizada", leftX + LANDSCAPE_LEFT_W / 2 - 1.4, y + 1.3, {
      align: "right",
      baseline: "top",
    });
  }
  y += rowH;
  landscapeField(
    doc,
    leftX,
    y,
    LANDSCAPE_LEFT_W,
    rowH,
    "# de orden del cliente",
    data.numeroOrdenCliente,
  );
  y += rowH;
  landscapeField(
    doc,
    leftX,
    y,
    LANDSCAPE_LEFT_W,
    rowH,
    "Folio factura asociada",
    factura,
    true,
  );
  y += rowH;
  landscapeField(doc, leftX, y, LANDSCAPE_LEFT_W, rowH, "Cliente: Razón Social", data.cliente);
  y += rowH;
  landscapeField(
    doc,
    leftX,
    y,
    LANDSCAPE_LEFT_W,
    rowH,
    "Cliente: Denominación Comercial",
    data.clienteDenominacionComercial ?? "",
  );
  y += rowH;
  landscapeField(doc, leftX, y, LANDSCAPE_LEFT_W, rowH, "Centro de consumo", data.centroConsumo);
  y += rowH;
  landscapeSplitField(
    doc,
    leftX,
    y,
    LANDSCAPE_LEFT_W,
    rowH,
    { label: "Fecha de entrega", value: data.fechaEntrega },
    { label: "Hora de entrega", value: data.horaEntrega },
  );
  y += rowH;
  landscapeField(
    doc,
    leftX,
    y,
    LANDSCAPE_LEFT_W,
    14,
    "Dirección de entrega",
    data.direccionEntrega,
  );
  y += 16;

  y = landscapeDrawNotesLines(doc, leftX, y, LANDSCAPE_LEFT_W, "", data.notasGenerales, 3);
  y += 2;

  const roleH = 11;
  const roleGap = 1.2;
  for (const item of ORDEN_TAREA_ALMACEN_SIGNATURE_ROLES) {
    if (y + roleH > LANDSCAPE_PAGE_BOTTOM) break;
    landscapeBox(doc, leftX, y, LANDSCAPE_LEFT_W, roleH, 0.6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(item.role, leftX + 1.4, y + 1.6, { baseline: "top" });
    const labelY = y + roleH - 2.5;
    if (item.esDespacho) {
      const texto = campoSurtido(data.surtido, ...item.textoKeys);
      const fecha = campoSurtido(data.surtido, ...(item.fechaKeys ?? []));
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text(texto || "Firma", leftX + 1.4, labelY, { baseline: "top" });
      doc.text(fecha || "Fecha", leftX + LANDSCAPE_LEFT_W - 1.4, labelY, {
        align: "right",
        baseline: "top",
      });
    } else {
      const texto = campoSurtido(data.surtido, ...item.textoKeys);
      if (texto) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.text(texto, leftX + 1.4, labelY, {
          baseline: "top",
          maxWidth: LANDSCAPE_LEFT_W - 2.8,
        });
      }
    }
    y += roleH + roleGap;
  }
  y += 1;

  const incidenciasTexto = campoSurtidoExact(
    data.surtido,
    "incidencias",
    "Incidencias",
  );
  landscapeDrawNotesLines(
    doc,
    leftX,
    y,
    LANDSCAPE_LEFT_W,
    "Incidencias",
    incidenciasTexto,
    8,
    5.2,
    true,
  );
  return y;
}