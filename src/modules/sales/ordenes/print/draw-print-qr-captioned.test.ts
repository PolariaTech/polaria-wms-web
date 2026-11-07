import { jsPDF } from "jspdf";
import { describe, expect, it, vi } from "vitest";
import {
  drawPrintQrCaptioned,
  printQrCaptionedHeight,
} from "./draw-print-qr-captioned";

describe("drawPrintQrCaptioned", () => {
  it("reserva altura con día", () => {
    expect(printQrCaptionedHeight(26, "VIERNES")).toBe(26 + 1 + 9 + 1 + 3.5);
  });

  it("reserva altura sin día", () => {
    expect(printQrCaptionedHeight(26, null)).toBe(26 + 1 + 3.5);
  });

  it("alinea Creada/Impresa a la derecha del margen indicado", () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const text = vi.spyOn(doc, "text");
    const addImage = vi.spyOn(doc, "addImage").mockImplementation(() => doc);

    const h = drawPrintQrCaptioned(doc, {
      qrDataUrl: "data:image/png;base64,abc",
      creada: "05/11/2026 20:25",
      impresa: "06/11/2026 14:19",
      diaEntrega: "VIERNES",
      centerX: 100,
      topY: 10,
      size: 26,
      metaRightX: 207.9,
    });

    expect(addImage).toHaveBeenCalled();
    expect(text).toHaveBeenCalledWith(
      "VIERNES",
      100,
      expect.any(Number),
      expect.objectContaining({ align: "center" }),
    );
    expect(text).toHaveBeenCalledWith(
      "Creada 05/11/2026 20:25  ·  Impresa 06/11/2026 14:19",
      207.9,
      expect.any(Number),
      expect.objectContaining({ align: "right" }),
    );
    const metaCall = text.mock.calls.find(
      (c) => typeof c[0] === "string" && String(c[0]).startsWith("Creada "),
    );
    expect(metaCall?.[2]).toBeGreaterThan(10 + 26);
    expect(h).toBe(printQrCaptionedHeight(26, "VIERNES"));
  });
});
