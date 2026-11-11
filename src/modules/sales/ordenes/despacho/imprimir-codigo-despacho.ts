import QRCode from "qrcode";
import { imprimirPdfListo } from "@/modules/sales/ordenes/print-batch/imprimir-pdf-listo";
import type { SilentPrintResult } from "@/modules/sales/ordenes/print/print-silent-cuenta";
import { resolveCapturaOrdenOrigin } from "@/modules/sales/ordenes/print/resolve-captura-orden-origin";
import {
  formatearFechaDespacho,
  renderDespachoQrPdf,
  urlDespachoConCuenta,
} from "./despacho-qr-pdf";

/** Falla que el operador puede entender: el mensaje ya dice qué pasó. */
export class CodigoDespachoError extends Error {}

/** Arma la hoja carta con el QR que abre la lista pública de despacho de la cuenta. */
async function armarPdfCodigoDespacho(codigoCuenta: string): Promise<Blob> {
  const origin = resolveCapturaOrdenOrigin();
  if (!origin) {
    throw new CodigoDespachoError(
      "No se pudo armar el enlace del código. Abre la aplicación desde su dirección oficial e inténtalo de nuevo.",
    );
  }
  try {
    const qrDataUrl = await QRCode.toDataURL(urlDespachoConCuenta(origin, codigoCuenta), {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 800,
      color: { dark: "#000000", light: "#ffffff" },
    });
    return renderDespachoQrPdf({
      fecha: formatearFechaDespacho(new Date(), "America/Bogota"),
      qrDataUrl,
    }).output("blob");
  } catch {
    throw new CodigoDespachoError("No se pudo generar el PDF. Inténtalo de nuevo.");
  }
}

/**
 * REQ-306: manda a la impresora configurada de la cuenta la hoja con el QR de despacho, por el
 * mismo camino que la impresión rápida y la detallada (correo, IPP o QZ Tray según la impresora).
 * La dirección del QR sale del origen vigente de la app (nunca un preview de Vercel), así que
 * cambia sola entre local, pruebas y producción.
 */
export async function imprimirCodigoDespacho(codigoCuenta: string): Promise<SilentPrintResult> {
  const cuenta = codigoCuenta.trim();
  if (!cuenta) {
    throw new CodigoDespachoError("No hay una cuenta activa para armar el código.");
  }
  const pdf = await armarPdfCodigoDespacho(cuenta);
  try {
    return await imprimirPdfListo(pdf, {
      codigoCuenta: cuenta,
      nombreTrabajo: "Código de despacho",
    });
  } catch (causa: unknown) {
    throw new CodigoDespachoError(
      causa instanceof Error && causa.message
        ? causa.message
        : "No se pudo enviar a la impresora. Revisa que esté encendida e inténtalo de nuevo.",
    );
  }
}
