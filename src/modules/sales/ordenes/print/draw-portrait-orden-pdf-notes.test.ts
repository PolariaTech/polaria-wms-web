import { jsPDF } from "jspdf";
import { describe, expect, it, vi } from "vitest";
import {
  portraitDrawNotesLines,
  portraitWritePageNumbers,
} from "./draw-portrait-orden-pdf-notes";

describe("draw-portrait-orden-pdf-notes", () => {
  it("portraitWritePageNumbers itera páginas", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const setPage = vi.spyOn(doc, "setPage");
    portraitWritePageNumbers(doc, "01/01/2026", "01/01/2026 10:00");
    expect(setPage).toHaveBeenCalledWith(1);
  });

  it("portraitDrawNotesLines dibuja líneas horizontales", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const line = vi.spyOn(doc, "line");
    portraitDrawNotesLines(doc, 30, "Notas", "texto", 2);
    expect(line.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});