import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { paginasDePdf, unirPdfs } from "./unir-pdfs";

function hoja(texto: string): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  doc.text(texto, 10, 10);
  return new Uint8Array(doc.output("arraybuffer"));
}

describe("unirPdfs", () => {
  it("pega las páginas en orden", async () => {
    const unido = await unirPdfs([hoja("Primera"), hoja("Segunda")]);

    expect(await paginasDePdf(unido)).toBe(2);
  });

  it("rechaza una lista vacía", async () => {
    await expect(unirPdfs([])).rejects.toThrow("No hay PDF para unir.");
  });
});
