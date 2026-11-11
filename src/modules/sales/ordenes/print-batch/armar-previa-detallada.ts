import { formatIsoToDdMmYyyy } from "@/lib/utils/fecha-dd-mm-yyyy";
import { buildOrdenTareaAlmacenLandscapePdfBlob } from "../print/download-orden-tarea-almacen-pdf";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import { diaEntregaDeOv, type ResumenOvBatch } from "./batch-seleccion";
import { armarPaqueteConOc, dependenciasReales } from "./armar-paquete-con-oc";
import { horaEnCuenta, hoyEnCuenta, nombreArchivoBatch, type PreviaBatch } from "./utilidades-batch";

export interface EntradaPreviaDetallada {
  codigoCuenta: string;
  zonaHoraria: string;
  hojas: OrdenTareaAlmacenPrintData[];
  resumen: ResumenOvBatch[];
  /** Con OC (REQ-298): se bajan los adjuntos HTML, PDF y Excel de cada OV y van detrás de sus OT. */
  conOc: boolean;
  /** `origen_archivos` de cada OV (`idOrdenVenta`); solo hace falta con OC. */
  origenPorOv: ReadonlyMap<string, string | null | undefined>;
  alProgreso: (texto: string) => void;
}

/** «Impresión detallada · entrega 06/11/2026» si todas las OV salen el mismo día; si no, solo «Impresión detallada». */
function subtituloDetallada(resumen: readonly ResumenOvBatch[]): string {
  const dias = new Set(resumen.map(({ row }) => diaEntregaDeOv(row)));
  const [dia] = [...dias];
  return dias.size === 1 && dia ? `Impresión detallada · entrega ${formatIsoToDdMmYyyy(dia)}` : "Impresión detallada";
}

/**
 * La vista previa de la Impresión detallada. Sin OC es el PDF de las hojas elegidas, tal cual. Con
 * OC cada OV lleva detrás sus órdenes de compra originales y, como el paquete pesa más, sale ya
 * armado y partido en envíos si pasa el límite de un correo; ese paquete abre con un resumen de lo
 * que lleva.
 */
export async function armarPreviaDetallada(entrada: EntradaPreviaDetallada): Promise<PreviaBatch> {
  const { codigoCuenta, zonaHoraria, hojas, resumen, conOc, origenPorOv, alProgreso } = entrada;

  if (!conOc) {
    const { blob } = await buildOrdenTareaAlmacenLandscapePdfBlob(hojas, { codigoCuenta });
    return { blob, hojas, resumen, nombreArchivo: nombreArchivoBatch() };
  }

  const generado = `Generado ${formatIsoToDdMmYyyy(hoyEnCuenta(zonaHoraria))} ${horaEnCuenta(zonaHoraria)}`;
  const { partes, resumenPdf } = await armarPaqueteConOc(
    { hojas, resumen, origenPorOv, subtitulo: subtituloDetallada(resumen), generado, alProgreso },
    dependenciasReales(async (todas) => {
      const { blob } = await buildOrdenTareaAlmacenLandscapePdfBlob(todas, { codigoCuenta });
      return new Uint8Array(await blob.arrayBuffer());
    }),
  );
  // Con varios envíos, la vista previa es la primera parte: trae el resumen de todo y las primeras OV.
  return { blob: partes[0]!.pdf!, hojas, resumen, nombreArchivo: nombreArchivoBatch(), resumenPdf, partes };
}
