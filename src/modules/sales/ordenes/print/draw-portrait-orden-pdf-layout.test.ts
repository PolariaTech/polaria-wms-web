import { jsPDF } from "jspdf";
import { describe, expect, it, vi } from "vitest";
import {
  portraitBox,
  portraitEnsureSpace,
  portraitField,
  portraitMarkTickCell,
} from "./draw-portrait-orden-pdf-layout";

describe("draw-portrait-orden-pdf-layout", () => {
  it("portraitBox dibuja rectángulo", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const rect = vi.spyOn(doc, "rect");
    portraitBox(doc, 1, 2, 10, 8);
    expect(rect).toHaveBeenCalledWith(1, 2, 10, 8, "S");
  });

  it("portraitMarkTickCell marca X si checked", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const text = vi.spyOn(doc, "text");
    portraitMarkTickCell(doc, 0, 0, 12, 8, true);
    expect(text).toHaveBeenCalledWith(
      "X",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" }),
    );
  });

  it("portraitField escribe etiqueta", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const text = vi.spyOn(doc, "text");
    portraitField(doc, 5, 5, 30, 10, "Etiqueta", "Valor");
    expect(text).toHaveBeenCalledWith(
      "Etiqueta",
      expect.any(Number),
      expect.any(Number),
      expect.any(Object),
    );
  });

  it("portraitEnsureSpace conserva Y si cabe", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const addPage = vi.spyOn(doc, "addPage");
    expect(portraitEnsureSpace(doc, 20, 50)).toBe(20);
    expect(addPage).not.toHaveBeenCalled();
  });
});