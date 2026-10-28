/**
 * Estado de la cola de Windows después de que QZ Tray acepta el PDF.
 * No decide si el papel salió: solo traduce el estado que reporta la impresora.
 */

export type PrintQueueOutcome =
  | { kind: "printing" }
  | { kind: "queued_offline" }
  | { kind: "queued_attention"; reason: string }
  | { kind: "unknown" };

export type PrinterStatusEvent = {
  printerName?: string;
  statusText?: string;
  message?: string;
};

const ATTENTION: Array<{ token: string; reason: string }> = [
  { token: "PAPER_JAM", reason: "atasco de papel" },
  { token: "PAPEROUT", reason: "sin papel" },
  { token: "PAPER_OUT", reason: "sin papel" },
  { token: "PAPER_PROBLEM", reason: "problema de papel" },
  { token: "DOOR_OPEN", reason: "puerta abierta" },
  { token: "NO_TONER", reason: "sin tóner" },
  { token: "USER_INTERVENTION", reason: "necesita intervención" },
  { token: "OUTPUT_BIN_FULL", reason: "bandeja de salida llena" },
  { token: "MANUAL_FEED", reason: "espera papel manual" },
  { token: "OUT_OF_MEMORY", reason: "sin memoria" },
  { token: "PAUSED", reason: "está en pausa" },
];

const PRINTING_TOKENS = [
  "OK",
  "PRINTING",
  "BUSY",
  "SPOOLING",
  "COMPLETE",
  "PROCESSING",
  "WAITING",
  "WARMING_UP",
  "INITIALIZING",
  "IO_ACTIVE",
  "POWER_SAVE",
];

function statusBlob(events: readonly PrinterStatusEvent[]): string {
  return events
    .map((event) => `${event.statusText ?? ""} ${event.message ?? ""}`)
    .join(" ")
    .toUpperCase();
}

function hasToken(blob: string, token: string): boolean {
  const pattern = new RegExp(`(?:^|[^A-Z0-9])${token}(?:[^A-Z0-9]|$)`);
  return pattern.test(blob);
}

/** Elige el aviso a partir de los eventos de QZ. Sin eventos, el estado queda desconocido. */
export function classifyPrinterStatuses(
  events: readonly PrinterStatusEvent[],
): PrintQueueOutcome {
  if (events.length === 0) return { kind: "unknown" };
  const blob = statusBlob(events);
  if (!blob.trim()) return { kind: "unknown" };

  if (
    hasToken(blob, "OFFLINE") ||
    hasToken(blob, "NOT_AVAILABLE") ||
    blob.includes("FUERA DE LINEA") ||
    blob.includes("FUERA DE LÍNEA")
  ) {
    return { kind: "queued_offline" };
  }

  for (const item of ATTENTION) {
    if (hasToken(blob, item.token)) {
      return { kind: "queued_attention", reason: item.reason };
    }
  }

  if (hasToken(blob, "ERROR")) {
    return { kind: "queued_attention", reason: "error de la impresora" };
  }

  if (PRINTING_TOKENS.some((token) => hasToken(blob, token))) {
    return { kind: "printing" };
  }

  return { kind: "unknown" };
}

function impresoraLabel(impresora: string): string {
  const name = impresora.trim();
  return name || "la impresora";
}

function hojaLabel(hojas: number): string {
  const count = Number.isFinite(hojas) && hojas > 0 ? Math.floor(hojas) : 1;
  return count === 1
    ? "1 orden de trabajo enviada"
    : `${count} órdenes de trabajo enviadas`;
}

export function printQueueUserMessage(input: {
  outcome: PrintQueueOutcome;
  impresora: string;
  codigo?: string;
  hojas?: number;
}): { title: string; detail: string; line: string } {
  const impresora = impresoraLabel(input.impresora);
  const codigo = input.codigo?.trim() || "";

  if (input.outcome.kind === "queued_offline") {
    const detail = `Quedó en la cola de Windows. ${impresora} está apagada; sale sola al encenderla. No la vuelvas a imprimir.`;
    return {
      title: codigo ? `En cola — ${codigo}` : "En cola de Windows",
      detail,
      line: detail,
    };
  }

  if (input.outcome.kind === "queued_attention") {
    const detail = `Quedó en la cola, pero ${impresora} pide atención: ${input.outcome.reason}. Al resolverlo sale sola.`;
    return {
      title: codigo ? `Impresora pide atención — ${codigo}` : "Impresora pide atención",
      detail,
      line: detail,
    };
  }

  if (input.outcome.kind === "printing") {
    const detail = `Enviada a ${impresora}. Revisa que esté saliendo el papel.`;
    return {
      title: codigo ? `Impresión enviada — ${codigo}` : "Impresión enviada",
      detail,
      line: detail,
    };
  }

  const detail = codigo
    ? `${codigo}: ${hojaLabel(input.hojas ?? 1)}. Confirma en la impresora que hayan salido bien.`
    : `${hojaLabel(input.hojas ?? 1)}. Confirma en la impresora que hayan salido bien.`;
  return {
    title: codigo ? `Impresión enviada — ${codigo}` : "Impresión enviada",
    detail,
    line: `Impresión enviada. ${detail}`,
  };
}

export function printQueueLogMensaje(input: {
  outcome: PrintQueueOutcome;
  impresora: string;
  autor: string;
  auto: boolean;
}): string {
  const autor = input.autor.trim() || "usuario";
  const impresora = impresoraLabel(input.impresora);
  const via = input.auto ? " (auto tras validar)" : "";

  if (input.outcome.kind === "queued_offline") {
    return `PDF de almacén en cola de Windows${via}: ${impresora} está apagada o fuera de línea. Saldrá al encenderla. Registrado por ${autor}.`;
  }
  if (input.outcome.kind === "queued_attention") {
    return `PDF de almacén en cola de Windows${via}: ${impresora} pide atención (${input.outcome.reason}). Registrado por ${autor}.`;
  }
  if (input.outcome.kind === "printing") {
    return `PDF de almacén enviado a ${impresora} (en línea${input.auto ? ", auto tras validar" : ""}) por ${autor}.`;
  }
  return input.auto
    ? `PDF de almacén enviado a impresora (auto tras validar) por ${autor}.`
    : `PDF de almacén enviado a impresora por ${autor}.`;
}

export function printQueuePayload(input: {
  tipo: "impresion_pdf" | "impresion_pdf_auto";
  hojas: number;
  impresora: string;
  outcome: PrintQueueOutcome;
}): Record<string, unknown> {
  return {
    tipo: input.tipo,
    hojas: input.hojas,
    impresora: input.impresora,
    cola: input.outcome.kind,
    ...(input.outcome.kind === "queued_attention"
      ? { motivo: input.outcome.reason }
      : {}),
  };
}

/** El PDF no llegó a la cola. La orden de venta ya está confirmada. */
export function printNotQueuedDetail(message: string): string {
  const detail = message.trim();
  return detail
    ? `La OV quedó confirmada, pero el PDF no entró a la cola. ${detail}`
    : "La OV quedó confirmada, pero el PDF no entró a la cola. Abre QZ Tray y reimprime.";
}
