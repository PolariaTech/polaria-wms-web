import { PDFDocument, PDFPage } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";
import { ensamblarPaquete } from "./ensamblar-paquete";

/** Cada página se distingue por su ancho: así se ve en qué orden quedaron. */
async function pdfConAnchos(...anchos: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const ancho of anchos) doc.addPage([ancho, 100]);
  return doc.save();
}

async function anchosDe(pdf: Uint8Array): Promise<number[]> {
  return (await PDFDocument.load(pdf)).getPages().map((pagina) => Math.round(pagina.getWidth()));
}

describe("ensamblarPaquete", () => {
  it("el resumen va de primera hoja y por cada OV van sus hojas de OT y luego sus OC", async () => {
    const resultado = await ensamblarPaquete({
      resumen: await pdfConAnchos(901),
      // OV A: 2 hojas de OT; OV B: 1 hoja de OT.
      ot: await pdfConAnchos(101, 102, 103),
      ovs: [
        { hojasOt: 2, oc: [await pdfConAnchos(201, 202), await pdfConAnchos(203)] },
        { hojasOt: 1, oc: [await pdfConAnchos(301)] },
      ],
    });

    expect(await anchosDe(resultado)).toEqual([901, 101, 102, 201, 202, 203, 103, 301]);
  });

  it("una OV sin OC deja sus hojas de OT seguidas de las de la siguiente", async () => {
    const resultado = await ensamblarPaquete({
      resumen: null,
      ot: await pdfConAnchos(101, 102),
      ovs: [
        { hojasOt: 1, oc: [] },
        { hojasOt: 1, oc: [await pdfConAnchos(301)] },
      ],
    });

    expect(await anchosDe(resultado)).toEqual([101, 102, 301]);
  });

  it("numera todas las hojas del paquete, la primera del resumen como la hoja 1", async () => {
    const texto = vi.spyOn(PDFPage.prototype, "drawText");
    await ensamblarPaquete({
      resumen: await pdfConAnchos(901),
      ot: await pdfConAnchos(101, 102),
      ovs: [{ hojasOt: 2, oc: [await pdfConAnchos(201)] }],
    });

    expect(texto.mock.calls.map((c) => c[0])).toEqual(["Hoja 1 de 4", "Hoja 2 de 4", "Hoja 3 de 4", "Hoja 4 de 4"]);
    texto.mockRestore();
  });

  it("con el paquete partido cada hoja dice de qué envío es", async () => {
    const texto = vi.spyOn(PDFPage.prototype, "drawText");
    await ensamblarPaquete({ resumen: null, ot: await pdfConAnchos(101), ovs: [{ hojasOt: 1, oc: [] }], etiquetaParte: "2/3" });

    expect(texto.mock.calls.map((c) => c[0])).toEqual(["Parte 2/3 · Hoja 1 de 1"]);
    texto.mockRestore();
  });

  it("un resumen de varias páginas entra completo antes de todo lo demás", async () => {
    const resultado = await ensamblarPaquete({
      resumen: await pdfConAnchos(901, 902),
      ot: await pdfConAnchos(101),
      ovs: [{ hojasOt: 1, oc: [] }],
    });

    expect(await anchosDe(resultado)).toEqual([901, 902, 101]);
  });

  it("con `inicioOt` cada envío toma solo sus hojas del PDF de todo el paquete", async () => {
    const ot = await pdfConAnchos(101, 102, 103, 104);

    const segundaParte = await ensamblarPaquete({
      resumen: null,
      ot,
      inicioOt: 2,
      ovs: [
        { hojasOt: 1, oc: [await pdfConAnchos(203)] },
        { hojasOt: 1, oc: [] },
      ],
    });

    expect(await anchosDe(segundaParte)).toEqual([103, 203, 104]);
  });

  it("con `inicioOt` falla si le piden más hojas de las que quedan", async () => {
    await expect(
      ensamblarPaquete({
        resumen: null,
        ot: await pdfConAnchos(101, 102, 103),
        inicioOt: 2,
        ovs: [{ hojasOt: 2, oc: [] }],
      }),
    ).rejects.toThrow("El paquete trae 1 hojas de orden de tarea y las OV suman 2.");
  });

  it("devuelve un PDF válido que se puede volver a abrir", async () => {
    const resultado = await ensamblarPaquete({
      resumen: await pdfConAnchos(901),
      ot: await pdfConAnchos(101),
      ovs: [{ hojasOt: 1, oc: [await pdfConAnchos(201)] }],
    });

    expect(new TextDecoder().decode(resultado.slice(0, 5))).toBe("%PDF-");
    expect((await PDFDocument.load(resultado)).getPageCount()).toBe(3);
  });

  it("si las hojas de OT no coinciden con lo que suman las OV, falla en vez de mezclar OC", async () => {
    await expect(
      ensamblarPaquete({
        resumen: null,
        ot: await pdfConAnchos(101, 102, 103),
        ovs: [{ hojasOt: 2, oc: [] }],
      }),
    ).rejects.toThrow("El paquete trae 3 hojas de orden de tarea y las OV suman 2.");
  });
});
