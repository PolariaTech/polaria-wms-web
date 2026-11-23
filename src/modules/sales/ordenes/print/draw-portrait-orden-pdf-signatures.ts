import type { jsPDF } from "jspdf";
import { campoSurtido, campoSurtidoExact } from "../surtido/apply-surtido-to-print";
import { ORDEN_TAREA_ALMACEN_SIGNATURE_ROLES } from "./draw-orden-tarea-almacen-signature-roles";
import {
  PORTRAIT_CONTENT_W,
  PORTRAIT_MARGIN,
  portraitBox,
  portraitEnsureSpace,
} from "./draw-portrait-orden-pdf-layout";
import { portraitDrawNotesLines } from "./draw-portrait-orden-pdf-notes";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

export function portraitDrawSignaturesAndIncidencias(
  doc: jsPDF,
  data: OrdenTareaAlmacenPrintData,
  startY: number,
  sigH = 16,
): number {
  let y = startY + 2;
  y = portraitEnsureSpace(doc, y, 6 + sigH);
  doc.setLineWidth(0.5);
  doc.line(PORTRAIT_MARGIN, y, PORTRAIT_MARGIN + PORTRAIT_CONTENT_W, y);
  y += 3;

  const sigW = PORTRAIT_CONTENT_W / ORDEN_TAREA_ALMACEN_SIGNATURE_ROLES.length;
  ORDEN_TAREA_ALMACEN_SIGNATURE_ROLES.forEach((item, index) => {
    const x = PORTRAIT_MARGIN + sigW * index;
    portraitBox(doc, x, y, sigW, sigH, 0.6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(item.role, x + 1.6, y + 1.6, { baseline: "top" });

    const labelY = y + sigH - 3.8;
    const texto = campoSurtido(data.surtido, ...item.textoKeys);
    if (item.esDespacho) {
      const fecha = campoSurtido(data.surtido, ...(item.fechaKeys ?? []));
      if (texto) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.text(texto, x + 1.6, labelY, {
          baseline: "top",
          maxWidth: sigW / 2 - 3,
        });
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.text("Firma", x + 1.6, labelY, { baseline: "top" });
      }
      if (fecha) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.text(fecha, x + sigW - 1.6, labelY, {
          align: "right",
          baseline: "top",
        });
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.8);
        doc.text("Fecha", x + sigW - 1.6, labelY, {
          align: "right",
          baseline: "top",
        });
      }
      return;
    }

    if (texto) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.text(texto, x + 1.6, labelY, {
        baseline: "top",
        maxWidth: sigW - 3.2,
      });
    }
  });
  y += sigH + 3;

  const incidenciasTexto = campoSurtidoExact(
    data.surtido,
    "incidencias",
    "Incidencias",
  );
  portraitDrawNotesLines(
    doc,
    y,
    "Incidencias",
    incidenciasTexto,
    9,
    4.8,
    true,
    false,
  );
  return y;
}