import QRCode from "qrcode";
import { resolveCapturaOrdenOrigin } from "@/modules/sales/ordenes/print/resolve-captura-orden-origin";
import {
  formatearFechaDespacho,
  renderDespachoQrPdf,
  urlDespachoConCuenta,
} from "./despacho-qr-pdf";

/** Falla que el operador puede entender: el mensaje ya dice qué pasó. */
export class CodigoDespachoError extends Error {}

/**
 * REQ-306: descarga la hoja carta con el QR que abre la lista pública de despacho de la cuenta.
 * La dirección del QR sale del origen de la app en uso (nunca un preview de Vercel), así que
 * cambia sola entre local, pruebas y producción.
 */
export async function guardarPdfCodigoDespacho(codigoCuenta: string): Promise<void> {
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
    const doc = renderDespachoQrPdf({
      fecha: formatearFechaDespacho(new Date(), "America/Bogota"),
      qrDataUrl,
    });
    doc.save("despachos.pdf");
  } catch {
    throw new CodigoDespachoError("No se pudo generar el PDF. Inténtalo de nuevo.");
  }
}
