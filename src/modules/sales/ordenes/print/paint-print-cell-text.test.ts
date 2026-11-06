import { jsPDF } from "jspdf";
import { describe, expect, it, vi } from "vitest";
import { paintPrintCellText } from "./paint-print-cell-text";

describe("paintPrintCellText (REQ-282)", () => {
  it("no escribe si el texto está vacío", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const text = vi.spyOn(doc, "text");
    paintPrintCellText(doc, "   ", 0, 0, 20, 8);
    expect(text).not.toHaveBeenCalled();
  });

  it("reduce la fuente para que el texto quepa en la celda", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const setFontSize = vi.spyOn(doc, "setFontSize");
    const long =
      "Especificación muy larga con madurez amarilla, 4 pz y notas de empaque";
    paintPrintCellText(doc, long, 0, 0, 18, 6, { preferSize: 7.5 });
    const sizes = setFontSize.mock.calls.map((call) => call[0] as number);
    expect(Math.min(...sizes)).toBeLessThan(7.5);
  });
});
