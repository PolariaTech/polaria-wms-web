import { describe, expect, it } from "vitest";
import {
  classifyPrinterStatuses,
  printNotQueuedDetail,
  printQueueLogMensaje,
  printQueuePayload,
  printQueueUserMessage,
} from "./print-queue-status";

describe("classifyPrinterStatuses", () => {
  it("sin eventos no afirma que la impresora esté en línea", () => {
    expect(classifyPrinterStatuses([])).toEqual({ kind: "unknown" });
  });

  it("OFFLINE deja el trabajo en cola", () => {
    expect(
      classifyPrinterStatuses([{ statusText: "OFFLINE", printerName: "Bodega" }]),
    ).toEqual({ kind: "queued_offline" });
  });

  it("un mensaje que dice offline también cuenta", () => {
    expect(
      classifyPrinterStatuses([
        { statusText: "ERROR", message: "The printer is offline" },
      ]),
    ).toEqual({ kind: "queued_offline" });
  });

  it("prioriza apagada sobre sin papel", () => {
    expect(
      classifyPrinterStatuses([
        { statusText: "OK" },
        { statusText: "PAPER_OUT" },
        { statusText: "OFFLINE" },
      ]),
    ).toEqual({ kind: "queued_offline" });
  });

  it("sin papel pide atención y el papel no se da por salido", () => {
    expect(classifyPrinterStatuses([{ statusText: "PAPER_OUT" }])).toEqual({
      kind: "queued_attention",
      reason: "sin papel",
    });
  });

  it("pausa pide atención", () => {
    expect(classifyPrinterStatuses([{ statusText: "PAUSED" }])).toEqual({
      kind: "queued_attention",
      reason: "está en pausa",
    });
  });

  it("ERROR suelto no se muestra como impresión en curso", () => {
    expect(classifyPrinterStatuses([{ statusText: "ERROR" }])).toEqual({
      kind: "queued_attention",
      reason: "error de la impresora",
    });
  });

  it("OK, PRINTING y BUSY son impresión en curso", () => {
    expect(classifyPrinterStatuses([{ statusText: "OK" }])).toEqual({
      kind: "printing",
    });
    expect(classifyPrinterStatuses([{ statusText: "PRINTING" }])).toEqual({
      kind: "printing",
    });
    expect(classifyPrinterStatuses([{ statusText: "BUSY" }])).toEqual({
      kind: "printing",
    });
  });
});

describe("printQueueUserMessage", () => {
  it("en línea pide mirar el papel", () => {
    expect(
      printQueueUserMessage({
        outcome: { kind: "printing" },
        impresora: "Bodega",
        codigo: "OV-00000690",
      }),
    ).toMatchObject({
      title: "Impresión enviada — OV-00000690",
      detail: "Enviada a Bodega. Revisa que esté saliendo el papel.",
    });
  });

  it("apagada avisa que saldrá sola y que no se reimprima", () => {
    const message = printQueueUserMessage({
      outcome: { kind: "queued_offline" },
      impresora: "Bodega",
    });
    expect(message.detail).toBe(
      "Quedó en la cola de Windows. Bodega está apagada; sale sola al encenderla. No la vuelvas a imprimir.",
    );
    expect(message.line).toBe(message.detail);
  });

  it("atención nombra el motivo", () => {
    expect(
      printQueueUserMessage({
        outcome: { kind: "queued_attention", reason: "sin papel" },
        impresora: "Bodega",
      }).detail,
    ).toBe(
      "Quedó en la cola, pero Bodega pide atención: sin papel. Al resolverlo sale sola.",
    );
  });

  it("sin estado conserva la confirmación en la impresora", () => {
    const message = printQueueUserMessage({
      outcome: { kind: "unknown" },
      impresora: "Bodega",
      codigo: "OV-1",
      hojas: 2,
    });
    expect(message.detail).toContain("Confirma en la impresora que hayan salido bien.");
    expect(message.line.startsWith("Impresión enviada.")).toBe(true);
  });
});

describe("bitácora", () => {
  it("guarda el estado de la cola sin perder el tipo de impresión", () => {
    expect(
      printQueueLogMensaje({
        outcome: { kind: "queued_offline" },
        impresora: "Bodega",
        autor: "Andrés",
        auto: true,
      }),
    ).toContain("apagada o fuera de línea");

    expect(
      printQueuePayload({
        tipo: "impresion_pdf_auto",
        hojas: 1,
        impresora: "Bodega",
        outcome: { kind: "queued_attention", reason: "atasco de papel" },
      }),
    ).toEqual({
      tipo: "impresion_pdf_auto",
      hojas: 1,
      impresora: "Bodega",
      cola: "queued_attention",
      motivo: "atasco de papel",
    });
  });

  it("si el PDF no entra a la cola, la OV sigue confirmada", () => {
    expect(printNotQueuedDetail("No hay conexión con QZ Tray.")).toContain(
      "La OV quedó confirmada, pero el PDF no entró a la cola.",
    );
  });
});
