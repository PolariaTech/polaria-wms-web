import { jsPDF } from "jspdf";
import { describe, expect, it, vi } from "vitest";
import { drawPrintQr } from "./draw-print-qr";

describe("drawPrintQr", () => {
  it("usa addImage cuando hay dataUrl", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const addImage = vi.spyOn(doc, "addImage").mockImplementation(() => doc);

    drawPrintQr(doc, "data:image/png;base64,abc", 10, 20, 26);

    expect(addImage).toHaveBeenCalledWith(
      "data:image/png;base64,abc",
      "PNG",
      10,
      20,
      26,
      26,
    );
  });

  it("dibuja caja de respaldo si no hay dataUrl", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const rect = vi.spyOn(doc, "rect");
    const text = vi.spyOn(doc, "text");

    drawPrintQr(doc, null, 5, 5, 26);

    expect(rect).toHaveBeenCalled();
    expect(text).toHaveBeenCalledWith(
      "QR",
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: "center" }),
    );
  });
});
