"use client";

import QRCode from "qrcode";
import { normalizeIdOrdenTrabajo } from "../utils/origen-correo-ordenes-trabajo";
import { stampOrdenTareaImpresaNow } from "./map-orden-tarea-almacen";
import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

function sanitizePdfFilename(folio: string): string {
  const cleaned = folio.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || "orden";
}

export { normalizeIdOrdenTrabajo };

export function buildCapturaOrdenUrl(
  idOrdenVenta: string,
  idOrdenTrabajo?: string | null,
): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "");
  const base = `${origin}/captura-orden/${encodeURIComponent(idOrdenVenta)}`;
  const ot = normalizeIdOrdenTrabajo(idOrdenTrabajo);
  if (!ot) return base;
  return `${base}?ot=${encodeURIComponent(ot)}`;
}

async function withQrDataUrl(
  data: OrdenTareaAlmacenPrintData,
): Promise<OrdenTareaAlmacenPrintData> {
  if (data.qrDataUrl) return data;
  const id = data.idOrdenVenta?.trim();
  if (!id) return data;
  try {
    const qrDataUrl = await QRCode.toDataURL(
      buildCapturaOrdenUrl(id, data.idOrdenTrabajo),
      {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 256,
        color: { dark: "#000000", light: "#ffffff" },
      },
    );
    return { ...data, qrDataUrl };
  } catch {
    return data;
  }
}

function multiFilename(
  sheets: readonly OrdenTareaAlmacenPrintData[],
  options?: { filenameSuffix?: string },
): string {
  const folio = sanitizePdfFilename(sheets[0]?.folio ?? "orden");
  const total =
    sheets[0]?.tareaTotal && sheets[0].tareaTotal > 0
      ? sheets[0].tareaTotal
      : sheets.length;
  const pagesPart = total > 1 ? `-${total}-ots` : "";
  const suffix = options?.filenameSuffix?.trim()
    ? `-${options.filenameSuffix.trim()}`
    : "-horizontal";
  return `orden-venta-${folio}${pagesPart}${suffix}.pdf`;
}

/** Imprime en la impresora de la cuenta (IPP y/o QZ Tray), sin diálogo del browser. */
export async function printOrdenTareaAlmacen(
  data: OrdenTareaAlmacenPrintData,
  options?: { codigoCuenta?: string },
): Promise<void> {
  const { buildOrdenTareaAlmacenPdf } = await import(
    "./render-orden-tarea-almacen-pdf"
  );
  const stamped = stampOrdenTareaImpresaNow([data])[0]!;
  const withQr = await withQrDataUrl(stamped);
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
  const folio = sanitizePdfFilename(data.folio);
  const suffix = options?.filenameSuffix?.trim()
    ? `-${options.filenameSuffix.trim()}`
    : "";
  const filename = `orden-venta-${folio}${suffix}.pdf`;
  const stamped = stampOrdenTareaImpresaNow([data])[0]!;
  const withQr = await withQrDataUrl(stamped);
  const pdf = buildOrdenTareaAlmacenPdf(withQr);
  pdf.save(filename);
}

export async function downloadOrdenTareaAlmacenLandscapePdf(
  data: OrdenTareaAlmacenPrintData,
  options?: { filenameSuffix?: string },
): Promise<void> {
  await downloadOrdenTareaAlmacenLandscapePdfs([data], options);
}

/** Una sola descarga: PDF multipágina (una página por orden de trabajo). */
export async function downloadOrdenTareaAlmacenLandscapePdfs(
  sheets: readonly OrdenTareaAlmacenPrintData[],
  options?: { filenameSuffix?: string },
): Promise<void> {
  const { blob, filename } = await buildOrdenTareaAlmacenLandscapePdfBlob(
    sheets,
    options,
  );
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Blob + nombre para vista previa en la app (sin forzar descarga). */
export async function buildOrdenTareaAlmacenLandscapePdfBlob(
  sheets: readonly OrdenTareaAlmacenPrintData[],
  options?: { filenameSuffix?: string },
): Promise<{ blob: Blob; filename: string }> {
  if (sheets.length === 0) {
    throw new Error("No hay órdenes de trabajo para previsualizar.");
  }
  const { buildOrdenTareaAlmacenLandscapePdfMulti } = await import(
    "./render-orden-tarea-almacen-landscape-pdf"
  );
  const stamped = stampOrdenTareaImpresaNow(sheets);
  const withQr = await Promise.all(stamped.map((sheet) => withQrDataUrl(sheet)));
  const pdf = buildOrdenTareaAlmacenLandscapePdfMulti(withQr);
  return {
    blob: pdf.output("blob"),
    filename: multiFilename(withQr, options),
  };
}
