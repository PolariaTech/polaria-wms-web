import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { textoPdf } from "./texto-pdf-flate";

describe("textoPdf", () => {
  it("lee un texto con acento dentro de un stream comprimido", () => {
    const pdf = new jsPDF({ compress: true, unit: "mm", format: "letter" });
    pdf.text("Documentación", 10, 10);
    expect(textoPdf(pdf)).toContain("Documentación");
  });
});
