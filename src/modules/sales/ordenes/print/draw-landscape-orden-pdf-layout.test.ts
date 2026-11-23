import { jsPDF } from "jspdf";
import { describe, expect, it, vi } from "vitest";
import {
  landscapeBox,
  landscapeField,
  landscapeDrawNotesLines,
} from "./draw-landscape-orden-pdf-layout";

describe("draw-landscape-orden-pdf-layout", () => {
  it("landscapeBox dibuja rectángulo", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const rect = vi.spyOn(doc, "rect");
    landscapeBox(doc, 0, 0, 20, 10);
    expect(rect).toHaveBeenCalled();
  });

  it("landscapeDrawNotesLines dibuja al menos una línea", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const line = vi.spyOn(doc, "line");
    landscapeDrawNotesLines(doc, 8, 20, 70, "", "nota", 2);
    expect(line.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("landscapeField escribe label", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const text = vi.spyOn(doc, "text");
    landscapeField(doc, 0, 0, 40, 10, "Cliente");
    expect(text).toHaveBeenCalled();
  });
});