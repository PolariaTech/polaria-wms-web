import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import type { OrdenVentaOperadorRow } from "../../shared/types/sales.types";
import type { ResumenOvBatch } from "./batch-seleccion";
import { pegarPrefacturas, previaSoloPrefacturas, sumarPrefacturas, type AnexoPrefactura } from "./pegar-prefacturas";
import type { PreviaBatch } from "./utilidades-batch";
import { paginasDePdf } from "./unir-pdfs";

function pdf(texto: string): Blob {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  doc.text(texto, 10, 10);
  return new Blob([doc.output("arraybuffer")], { type: "application/pdf" });
}

function resumen(id: string): ResumenOvBatch {
  return { row: { idOrdenVenta: id, venta: id } as OrdenVentaOperadorRow, ots: [1] };
}

function anexo(id: string): AnexoPrefactura {
  return { idOrdenVenta: id, pdf: pdf(`Prefactura ${id}`) };
}

describe("pegarPrefacturas", () => {
  it("sin anexos devuelve el mismo archivo", async () => {
    const base = new Blob(["igual"]);

    await expect(pegarPrefacturas(base, ["a"], undefined)).resolves.toBe(base);
  });

  it("suma la prefactura de la OV pedida y deja fuera la de otra", async () => {
    const unido = await pegarPrefacturas(pdf("OT"), ["a"], [anexo("a"), anexo("b")]);

    expect(await paginasDePdf(new Uint8Array(await unido.arrayBuffer()))).toBe(2);
  });
});

describe("sumarPrefacturas", () => {
  it("cuenta las páginas de la prefactura sin sustituir el PDF de la parte", async () => {
    const previa: PreviaBatch = {
      blob: pdf("Paquete"),
      hojas: [],
      resumen: [resumen("a")],
      nombreArchivo: "x.pdf",
      partes: [{ hojas: [], resumen: [resumen("a")] }],
    };

    const siguiente = await sumarPrefacturas(previa, [anexo("a")], async () => previa.blob);

    expect(siguiente.partes?.[0]?.pdf).toBeInstanceOf(Blob);
    expect(siguiente.partes?.[0]?.paginasExtra).toBe(1);
    expect(await paginasDePdf(new Uint8Array(await siguiente.blob.arrayBuffer()))).toBe(2);
  });
});

describe("previaSoloPrefacturas", () => {
  it("manda el PDF de las prefacturas tal cual, sin hojas de orden de tarea", async () => {
    const previa = await previaSoloPrefacturas([resumen("a")], [anexo("a")], "pre.pdf");

    expect(previa.hojas).toHaveLength(0);
    expect(previa.partes?.[0]?.pdf).toBe(previa.blob);
    expect(previa.partes?.[0]?.paginasExtra).toBe(1);
  });
});
