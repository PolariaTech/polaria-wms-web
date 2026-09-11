"use client";

import QRCode from "qrcode";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

function sanitizePdfFilename(folio: string): string {
  const cleaned = folio.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "orden";
}

export function buildCapturaOrdenUrl(idOrdenVenta: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "");
  return `${origin}/captura-orden/${encodeURIComponent(idOrdenVenta)}`;
}

async function withQrDataUrl(
  data: OrdenTareaAlmacenPrintData,
): Promise<OrdenTareaAlmacenPrintData> {
  if (data.qrDataUrl) return data;
  const id = data.idOrdenVenta?.trim();
  if (!id) return data;
  try {
    const qrDataUrl = await QRCode.toDataURL(buildCapturaOrdenUrl(id), {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 256,
      color: { dark: "#000000", light: "#ffffff" },
    });
    return { ...data, qrDataUrl };
  } catch {
    return data;
  }
}

/** Imprime en la impresora de la cuenta (IPP y/o QZ Tray), sin diálogo del browser. */
export async function printOrdenTareaAlmacen(
  data: OrdenTareaAlmacenPrintData,
  options?: { codigoCuenta?: string },
): Promise<void> {
  const { buildOrdenTareaAlmacenPdf } = await import(
    "./render-orden-tarea-almacen-pdf"
  );
  const withQr = await withQrDataUrl(data);
  const pdf = buildOrdenTareaAlmacenPdf(withQr);
  const pdfBase64 = pdf.output("datauristring").split(",")[1] ?? "";

  const codigoCuenta = options?.codigoCuenta?.trim();
  if (!codigoCuenta) {
    throw new Error(
      "No se pudo imprimir: falta la cuenta activa. Recarga e inténtalo de nuevo.",
    );
  }
  if (!pdfBase64) {
    throw new Error("No se pudo generar el PDF para imprimir.");
  }

  const { printPdfSilentToCuenta } = await import("./print-silent-cuenta");
  await printPdfSilentToCuenta({
    codigoCuenta,
    pdfBase64,
    jobName: `OV ${data.folio || "Polaria"}`,
  });
}

export async function downloadOrdenTareaAlmacenPdf(
  data: OrdenTareaAlmacenPrintData,
  options?: { filenameSuffix?: string },
): Promise<void> {
  const { buildOrdenTareaAlmacenPdf } = await import(
    "./render-orden-tarea-almacen-pdf"
  );
  const suffix = options?.filenameSuffix?.trim()
    ? `-${options.filenameSuffix.trim()}`
    : "";
  const filename = `orden-venta-${sanitizePdfFilename(data.folio)}${suffix}.pdf`;
  const withQr = await withQrDataUrl(data);
  const pdf = buildOrdenTareaAlmacenPdf(withQr);
  pdf.save(filename);
}
