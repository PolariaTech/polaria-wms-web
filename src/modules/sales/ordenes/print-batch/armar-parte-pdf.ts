import { buildOrdenTareaAlmacenLandscapePdfBlob } from "../print/download-orden-tarea-almacen-pdf";
import { numerarBlobPdf } from "../print/numerar-hojas-pdf";
import type { ResumenImpresionPdf } from "../print/render-resumen-impresion-pdf";
import type { ParteEnvio } from "./partir-paquete";

/**
 * El PDF de una parte del paquete, el mismo que se manda a la impresora. Con OC ya viene armado en
 * la parte. Sin OC y con resumen se arma aquí: el resumen va solo en la primera parte y las hojas se
 * numeran («Hoja N de M») para que «Desde la hoja» del resumen las encuentre. Sin resumen (impresión
 * detallada) se arman las hojas tal cual.
 */
export async function armarPartePdf(input: {
  parte: ParteEnvio;
  /** Posición de la parte, desde 0. */
  indice: number;
  total: number;
  resumenPdf?: ResumenImpresionPdf;
  codigoCuenta: string;
}): Promise<Blob> {
  const { parte, indice, total, resumenPdf, codigoCuenta } = input;
  if (parte.pdf) return parte.pdf;
  const etiquetaParte = total > 1 ? `${indice + 1}/${total}` : undefined;
  const { blob } = await buildOrdenTareaAlmacenLandscapePdfBlob(parte.hojas, {
    codigoCuenta,
    resumen: indice === 0 ? resumenPdf : undefined,
  });
  return resumenPdf ? numerarBlobPdf(blob, etiquetaParte) : blob;
}

/** `impresion-batch-20261110-1530.pdf` → `impresion-batch-20261110-1530-parte-2-de-6.pdf`. */
export function nombreArchivoParte(nombreArchivo: string, indice: number, total: number): string {
  const base = nombreArchivo.replace(/\.pdf$/i, "");
  return `${base}-parte-${indice + 1}-de-${total}.pdf`;
}
