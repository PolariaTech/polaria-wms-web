import type { OrdenTareaAlmacenPrintData } from "../../print/orden-tarea-almacen.types";
import { buildOrdenTareaAlmacenLandscapePdfBlob } from "../../print/download-orden-tarea-almacen-pdf";
import { raceConTimeout } from "./race-con-timeout";

const PDF_BUILD_TIMEOUT_MS = 45_000;
const PDF_TIMEOUT_MESSAGE =
  "La generación del PDF está tardando demasiado. Inténtalo de nuevo.";

export async function buildOvPdfBlobConTimeout(
  sheets: readonly OrdenTareaAlmacenPrintData[],
): Promise<Blob> {
  if (sheets.length === 0) {
    throw new Error("No hay datos para generar el PDF.");
  }
  const result = await raceConTimeout(
    buildOrdenTareaAlmacenLandscapePdfBlob(sheets),
    PDF_BUILD_TIMEOUT_MS,
    PDF_TIMEOUT_MESSAGE,
  );
  return result.blob;
}
