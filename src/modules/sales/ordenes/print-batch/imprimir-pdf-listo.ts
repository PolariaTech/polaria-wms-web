import { printPdfSilentToCuenta, type SilentPrintResult } from "../print/print-silent-cuenta";

function blobABase64(blob: Blob): Promise<string> {
  return new Promise((listo, fallo) => {
    const lector = new FileReader();
    lector.onerror = () => fallo(new Error("No se pudo leer el PDF para imprimirlo."));
    lector.onload = () => {
      const base64 = String(lector.result ?? "").split(",")[1] ?? "";
      if (base64) listo(base64);
      else fallo(new Error("No se pudo generar el PDF para imprimir."));
    };
    lector.readAsDataURL(blob);
  });
}

/**
 * Manda a la impresora de la cuenta un PDF que ya está armado (el de un envío con OC). Va por el
 * mismo camino que cualquier otra impresión: correo, IPP o QZ Tray según la impresora.
 */
export async function imprimirPdfListo(
  pdf: Blob,
  opciones: { codigoCuenta: string; nombreTrabajo: string },
): Promise<SilentPrintResult> {
  const pdfBase64 = await blobABase64(pdf);
  return printPdfSilentToCuenta({
    codigoCuenta: opciones.codigoCuenta,
    pdfBase64,
    jobName: opciones.nombreTrabajo,
  });
}
