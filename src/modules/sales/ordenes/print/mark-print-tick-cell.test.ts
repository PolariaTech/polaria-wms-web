import { jsPDF } from "jspdf";
import { describe, expect, it, vi } from "vitest";
import { markPrintTickCell } from "./mark-print-tick-cell";

describe("markPrintTickCell", () => {
  it("dibuja X cuando checked", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const text = vi.spyOn(doc, "text");
    const box = vi.fn();
    markPrintTickCell(doc, 10, 20, 12, 8, true, box);
    expect(box).toHaveBeenCalled();
    expect(text).toHaveBeenCalledWith(
      "X",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" }),
    );
  });

  it("no dibuja X si no checked", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const text = vi.spyOn(doc, "text");
    markPrintTickCell(doc, 10, 20, 12, 8, false, vi.fn());
    expect(text).not.toHaveBeenCalled();
  });
});
