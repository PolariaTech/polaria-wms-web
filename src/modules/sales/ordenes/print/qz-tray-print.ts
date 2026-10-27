"use client";

import type { ImpresoraPrintTarget } from "@/modules/configurator/impresoras/services/impresoras.service";
import {
  classifyPrinterStatuses,
  type PrinterStatusEvent,
  type PrintQueueOutcome,
} from "./print-queue-status";

export type QzPrintResult = {
  impresora: string;
  queue: PrintQueueOutcome;
};

type QzTray = {
  websocket: {
    isActive: () => boolean;
    connect: (options?: { retries?: number; delay?: number }) => Promise<void>;
  };
  printers: {
    find: (query?: string) => Promise<string | string[]>;
    getDefault: () => Promise<string>;
    startListening: (printers: string | string[] | null) => Promise<unknown>;
    stopListening: () => Promise<unknown>;
    getStatus: () => Promise<unknown>;
    setPrinterCallbacks: (
      calls:
        | ((event: PrinterStatusEvent) => void)
        | Array<(event: PrinterStatusEvent) => void>,
    ) => void;
  };
  configs: {
    create: (
      printer: string | { host: string; port?: number },
      options?: { copies?: number; size?: { width?: number; height?: number } },
    ) => unknown;
  };
  print: (config: unknown, data: unknown[]) => Promise<void>;
  security: {
    setCertificatePromise: (
      fn: (resolve: (value?: string) => void, reject: (err?: unknown) => void) => void,
    ) => void;
    setSignaturePromise: (
      fn: (
        toSign: string,
      ) => (resolve: (value?: string) => void, reject: (err?: unknown) => void) => void,
    ) => void;
  };
};

let securityConfigured = false;

async function loadQz(): Promise<QzTray> {
  const mod = await import("qz-tray");
  const qz = (mod.default ?? mod) as QzTray;

  if (!securityConfigured) {
    // Sin certificado propio: QZ pedirá "Allow" una vez (no es el diálogo de Windows).
    qz.security.setCertificatePromise((resolve) => {
      resolve(undefined as unknown as string);
    });
    qz.security.setSignaturePromise(() => (resolve) => {
      resolve(undefined as unknown as string);
    });
    securityConfigured = true;
  }

  return qz;
}

async function ensureConnected(qz: QzTray): Promise<void> {
  if (qz.websocket.isActive()) return;
  await qz.websocket.connect({ retries: 3, delay: 1 });
}

function candidatePrinterNames(target: ImpresoraPrintTarget): string[] {
  return [
    target.nombreSistema?.trim(),
    target.nombre?.trim(),
    target.colaNombre?.trim(),
  ].filter((name): name is string => Boolean(name));
}

async function resolvePrinterName(
  qz: QzTray,
  target: ImpresoraPrintTarget,
): Promise<string> {
  const candidates = candidatePrinterNames(target);

  for (const name of candidates) {
    try {
      const found = await qz.printers.find(name);
      if (typeof found === "string" && found.trim()) return found;
      if (Array.isArray(found) && found[0]) return found[0];
    } catch {
      // sigue con el siguiente candidato
    }
  }

  if (candidates[0]) return candidates[0];

  const def = await qz.printers.getDefault();
  if (def?.trim()) return def;

  throw new Error(
    "QZ Tray no encontró impresora. Instálala en Windows con el mismo nombre que en Polaria (campo Nombre o Nombre sistema).",
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function pushStatusPayload(
  payload: unknown,
  push: (event: PrinterStatusEvent) => void,
): void {
  if (!payload) return;
  if (Array.isArray(payload)) {
    for (const item of payload) pushStatusPayload(item, push);
    return;
  }
  if (typeof payload !== "object") return;
  const record = payload as PrinterStatusEvent & {
    printers?: unknown;
    status?: unknown;
  };
  if (
    typeof record.statusText === "string" ||
    typeof record.message === "string" ||
    typeof record.printerName === "string"
  ) {
    push(record);
  }
  if (record.printers) pushStatusPayload(record.printers, push);
  if (Array.isArray(record.status)) pushStatusPayload(record.status, push);
}

/** Una sola lectura de estado a la vez: startListening/stopListening son globales en QZ. */
let statusRead: Promise<void> = Promise.resolve();

/**
 * QZ entrega el PDF al spooler y responde antes de saber si salió el papel.
 * Después se lee el estado de esa impresora en Windows.
 */
async function readPrinterQueueOutcome(
  qz: QzTray,
  printerName: string,
): Promise<PrintQueueOutcome> {
  const previous = statusRead;
  let release: () => void = () => undefined;
  statusRead = new Promise((resolve) => {
    release = resolve;
  });
  await previous;

  try {
    return await readPrinterQueueOutcomeOnce(qz, printerName);
  } finally {
    release();
  }
}

async function readPrinterQueueOutcomeOnce(
  qz: QzTray,
  printerName: string,
): Promise<PrintQueueOutcome> {
  const wanted = printerName.trim().toLowerCase();
  const events: PrinterStatusEvent[] = [];
  const push = (event: PrinterStatusEvent) => {
    const name = (event.printerName ?? "").trim().toLowerCase();
    if (name && name !== wanted) return;
    events.push(event);
  };

  qz.printers.setPrinterCallbacks(push);
  try {
    await qz.printers.startListening(printerName);
    pushStatusPayload(await qz.printers.getStatus().catch(() => null), push);

    const deadline = Date.now() + 1500;
    let definitiveAt: number | null = null;
    while (Date.now() < deadline) {
      const outcome = classifyPrinterStatuses(events);
      if (outcome.kind !== "unknown") {
        if (definitiveAt === null) definitiveAt = Date.now();
        if (Date.now() - definitiveAt >= 400) return classifyPrinterStatuses(events);
      }
      await sleep(100);
    }
    return classifyPrinterStatuses(events);
  } catch {
    return { kind: "unknown" };
  } finally {
    qz.printers.setPrinterCallbacks([]);
    try {
      await qz.printers.stopListening();
    } catch {
      // El PDF ya está en la cola. El aviso usa el estado que alcanzó a llegar.
    }
  }
}

/**
 * Imprime el PDF en silencio vía QZ Tray (agente local en el PC de la bodega).
 * Requisito: QZ Tray instalado y corriendo; impresora visible en Windows.
 * https://qz.io/download/
 */
export async function printPdfViaQzTray(input: {
  target: ImpresoraPrintTarget;
  pdfBase64: string;
}): Promise<QzPrintResult> {
  let qz: QzTray;
  try {
    qz = await loadQz();
  } catch {
    throw new Error(
      "No se pudo cargar QZ Tray. Instálalo desde https://qz.io/download/ y déjalo abierto.",
    );
  }

  try {
    await ensureConnected(qz);
  } catch {
    throw new Error(
      "No hay conexión con QZ Tray. Ábrelo en este PC (bandeja del sistema) e inténtalo de nuevo. Descarga: https://qz.io/download/",
    );
  }

  const copies = Math.min(99, Math.max(1, input.target.copiasDefault || 1));
  let config: unknown;
  let printerName = input.target.nombre?.trim() || "Impresora";
  let canReadWindowsStatus = false;

  if (
    (input.target.modoEnvio === "raw_9100" ||
      input.target.modoEnvio === "ipp") &&
    input.target.hostIp?.trim() &&
    input.target.modoEnvio === "raw_9100"
  ) {
    config = qz.configs.create(
      {
        host: input.target.hostIp.trim(),
        port: input.target.puerto && input.target.puerto > 0
          ? input.target.puerto
          : 9100,
      },
      { copies },
    );
  } else {
    printerName = await resolvePrinterName(qz, input.target);
    config = qz.configs.create(printerName, { copies });
    canReadWindowsStatus = true;
  }

  await qz.print(config, [
    {
      type: "pixel",
      format: "pdf",
      flavor: "base64",
      data: input.pdfBase64,
    },
  ]);

  const queue = canReadWindowsStatus
    ? await readPrinterQueueOutcome(qz, printerName)
    : { kind: "unknown" as const };

  return { impresora: printerName, queue };
}
