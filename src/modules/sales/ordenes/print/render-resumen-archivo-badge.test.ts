import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { dibujarCeldaArchivo } from "./render-resumen-archivo-badge";

const contenido = (pdf: jsPDF): string =>
  (pdf.internal as unknown as { pages: string[][] }).pages[1]!.join("\n");

describe("dibujarCeldaArchivo con íconos vectoriales (REQ-361)", () => {
  it("dibuja ícono rojo para PDF, azul para HTML y verde para Excel sin texto", () => {
    const pdf = new jsPDF({ unit: "mm", format: [215.9, 279.4] });
    dibujarCeldaArchivo(pdf, { x: 10, y: 10, ancho: 18, alto: 6.4, tipos: ["pdf"] });
    dibujarCeldaArchivo(pdf, { x: 10, y: 20, ancho: 18, alto: 6.4, tipos: ["html"] });
    dibujarCeldaArchivo(pdf, { x: 10, y: 30, ancho: 18, alto: 6.4, tipos: ["excel"] });

    const ops = contenido(pdf);
    // Colores RGB normalizados de PDF (220/255), HTML (37/255) y Excel (22/255).
    expect(ops).toContain("0.86 0.15 0.15 rg");
    expect(ops).toContain("0.15 0.39 0.92 rg");
    expect(ops).toContain("0.09 0.64 0.29 rg");
    expect(ops).not.toContain("(PDF) Tj");
    expect(ops).not.toContain("(HTML) Tj");
    expect(ops).not.toContain("(XLSX) Tj");
  });

  it("dibuja triángulo de alerta ámbar cuando la OV no tiene archivo de OC", () => {
    const pdf = new jsPDF({ unit: "mm", format: [215.9, 279.4] });
    dibujarCeldaArchivo(pdf, { x: 10, y: 10, ancho: 18, alto: 6.4, sinArchivo: true });

    const ops = contenido(pdf);
    expect(ops).toContain("0.96 0.62 0.04 rg");
    expect(ops).not.toContain("(SIN ARCH.) Tj");
  });

  it("dibuja un ícono por cada tipo único cuando la OV trae varios tipos", () => {
    const pdf = new jsPDF({ unit: "mm", format: [215.9, 279.4] });
    dibujarCeldaArchivo(pdf, { x: 10, y: 10, ancho: 18, alto: 6.4, tipos: ["pdf", "excel"] });

    const ops = contenido(pdf);
    expect(ops).toContain("0.86 0.15 0.15 rg");
    expect(ops).toContain("0.09 0.64 0.29 rg");
  });
});
