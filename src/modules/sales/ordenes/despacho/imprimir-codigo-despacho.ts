import QRCode from "qrcode";
import { imprimirPdfListo } from "@/modules/sales/ordenes/print-batch/imprimir-pdf-listo";
import {
  esErrorDeVersionVieja,
  MENSAJE_VERSION_NUEVA,
} from "@/modules/sales/ordenes/print/print-correo-fallo";
import type { SilentPrintResult } from "@/modules/sales/ordenes/print/print-silent-cuenta";
import { resolveCapturaOrdenOrigin } from "@/modules/sales/ordenes/print/resolve-captura-orden-origin";
import {
  formatearFechaDespacho,
  renderDespachoQrPdf,
  urlDespachoConCuenta,
} from "./despacho-qr-pdf";

/** Falla que el operador puede entender: el mensaje ya dice qué pasó. */
export class CodigoDespachoError extends Error {}

/**
 * Los únicos textos de la impresión que ya dicen qué hacer en lenguaje claro. Cualquier otro (lo
 * que devuelva QZ Tray, el servidor o el navegador) puede traer detalles técnicos —direcciones,
 * nombres de equipos, códigos— y el operador no los ve.
 */
const MENSAJES_PARA_OPERADOR: ReadonlySet<string> = new Set([
  "No hay impresora configurada.",
  "Falta la cuenta para imprimir.",
]);

const MENSAJE_IMPRESION_GENERICO =
  "No se pudo enviar a la impresora. Revisa que esté encendida e inténtalo de nuevo.";

/** El mensaje que verá el operador para un fallo de impresión; lo técnico queda fuera. */
function mensajeDeImpresionParaOperador(causa: unknown): string {
  if (esErrorDeVersionVieja(causa)) return MENSAJE_VERSION_NUEVA;
  if (causa instanceof Error && MENSAJES_PARA_OPERADOR.has(causa.message)) return causa.message;
  return MENSAJE_IMPRESION_GENERICO;
}

/**
 * REQ-306: arma la hoja carta con el QR que abre la lista pública de despacho de la cuenta. La
 * dirección del QR sale del origen vigente de la app (nunca un preview de Vercel), así que cambia
 * sola entre local, pruebas y producción. La misma hoja se muestra en la vista previa y se imprime.
 */
export async function prepararCodigoDespacho(codigoCuenta: string): Promise<Blob> {
  const cuenta = codigoCuenta.trim();
  if (!cuenta) {
    throw new CodigoDespachoError("No hay una cuenta activa para armar el código.");
  }
  const origin = resolveCapturaOrdenOrigin();
  if (!origin) {
    throw new CodigoDespachoError(
      "No se pudo armar el enlace del código. Abre la aplicación desde su dirección oficial e inténtalo de nuevo.",
    );
  }
  try {
    const qrDataUrl = await QRCode.toDataURL(urlDespachoConCuenta(origin, cuenta), {
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
 * Manda a la impresora configurada de la cuenta la hoja ya armada, por el mismo camino que la
 * impresión rápida y la detallada (correo, IPP o QZ Tray según la impresora).
 */
export async function imprimirCodigoDespacho(
  pdf: Blob,
  codigoCuenta: string,
): Promise<SilentPrintResult> {
  try {
    return await imprimirPdfListo(pdf, {
      codigoCuenta: codigoCuenta.trim(),
      nombreTrabajo: "Código de despacho",
    });
  } catch (causa: unknown) {
    throw new CodigoDespachoError(mensajeDeImpresionParaOperador(causa));
  }
}
