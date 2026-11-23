import type { jsPDF } from "jspdf";
import {
  PORTRAIT_CONTENT_W,
  PORTRAIT_MARGIN,
  PORTRAIT_PAGE_BOTTOM,
  portraitEnsureSpace,
} from "./draw-portrait-orden-pdf-layout";

export function portraitWritePageNumbers(
  doc: jsPDF,
  creada: string,
  impresa: string,
) {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.text(
      `Creada ${creada}  ·  Impresa ${impresa}`,
      PORTRAIT_MARGIN,
      4.5,
      { baseline: "top" },
    );
    doc.setTextColor(0);
  }
}

export function portraitDrawNotesLines(
  doc: jsPDF,
  y: number,
  label: string,
  value = "",
  lineCount = 2,
  lineStep = 5.2,
  startOnSecondLine = false,
  allowPageBreak = true,
): number {
  const hasLabel = Boolean(label.trim());
  const labelH = hasLabel ? 5.5 : 0;
  if (allowPageBreak) {
    const blockH = labelH + lineCount * lineStep;
    y = portraitEnsureSpace(doc, y, blockH + 2);
  } else {
    const remaining = PORTRAIT_PAGE_BOTTOM - y - labelH;
    lineCount = Math.max(4, Math.min(lineCount, Math.floor(remaining / lineStep)));
  }
  let lineY = y;
  if (hasLabel) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`${label}:`, PORTRAIT_MARGIN, y, { baseline: "top" });
    lineY = y + 5.5;
  } else {
    lineY = y + 3.2;
  }
  doc.setDrawColor(0);
  doc.setLineWidth(0.45);

  const textW = PORTRAIT_CONTENT_W - 2;
  const trimmed = value.replace(/\s+/g, " ").trim();
  const contentOffset = startOnSecondLine ? 1 : 0;
  const contentSlots = Math.max(0, lineCount - contentOffset);
  let lines: string[] = [];
  let fontSize = 7.5;

  if (trimmed && contentSlots > 0) {
    doc.setFont("helvetica", "normal");
    for (const size of [7.5, 6.5, 5.5, 4.8, 4.2]) {
      doc.setFontSize(size);
      const wrapped = doc.splitTextToSize(trimmed, textW);
      const all = Array.isArray(wrapped) ? wrapped : [wrapped];
      if (all.length <= contentSlots) {
        lines = all;
        fontSize = size;
        break;
      }
      lines = all.slice(0, contentSlots);
      fontSize = size;
    }
  }

  for (let index = 0; index < lineCount; index += 1) {
    doc.line(PORTRAIT_MARGIN, lineY, PORTRAIT_MARGIN + PORTRAIT_CONTENT_W, lineY);
    const lineText = lines[index - contentOffset];
    if (lineText) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      doc.text(lineText, PORTRAIT_MARGIN + 1, lineY - 1.4, { baseline: "bottom" });
    }
    lineY += lineStep;
  }
  return lineY - 1.5;
}