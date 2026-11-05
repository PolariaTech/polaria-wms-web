import { formatIsoToDdMmYyyy } from "@/lib/utils/fecha-dd-mm-yyyy";
import { buildOrdenTareaAlmacenLandscapePdfBlob } from "../print/download-orden-tarea-almacen-pdf";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { ResumenOvBatch } from "./batch-seleccion";
import { armarPaqueteConOc, dependenciasReales } from "./armar-paquete-con-oc";
import { HOJAS_QUE_SIEMPRE_CABEN, parteDeCadaOv, partirPaquete } from "./partir-paquete";
import { armarResumenImpresion } from "./resumen-impresion";
import {
  horaEnCuenta,
  hoyEnCuenta,
  nombreArchivoBatch,
  ordenDeImpresion,
  type PreviaBatch,
} from "./utilidades-batch";

export interface EntradaPreviaRapida {
  codigoCuenta: string;
  /** Fecha de entrega hasta la que se imprime (`YYYY-MM-DD`). */
  fecha: string;
  zonaHoraria: string;
  hojas: OrdenTareaAlmacenPrintData[];
  resumen: ResumenOvBatch[];
  /** Con OC (REQ-260): se bajan los adjuntos HTML, PDF y Excel de cada OV y van detrás de sus OT. */
  conOc: boolean;
  /** `origen_archivos` de cada OV (`idOrdenVenta`); solo hace falta con OC. */
  origenPorOv: ReadonlyMap<string, string | null | undefined>;
  alProgreso: (texto: string) => void;
}

/**
 * Arma lo que se muestra antes de imprimir y lo que se manda después. Sin OC: el PDF de las hojas de
 * OT con el resumen de primera hoja, partido en envíos si pesa más del límite de un correo. Con OC:
 * el mismo orden, pero cada OV lleva detrás sus órdenes de compra y cada envío sale ya armado.
 */
export async function armarPreviaRapida(entrada: EntradaPreviaRapida): Promise<PreviaBatch> {
  const { codigoCuenta, fecha, zonaHoraria, hojas, resumen, conOc, origenPorOv, alProgreso } = entrada;
  const subtitulo = `Impresión rápida · entrega hasta ${formatIsoToDdMmYyyy(fecha)}`;
  const generado = `Generado ${formatIsoToDdMmYyyy(hoyEnCuenta(zonaHoraria))} ${horaEnCuenta(zonaHoraria)}`;

  if (conOc) {
    const { partes, resumenPdf } = await armarPaqueteConOc(
      { hojas, resumen, origenPorOv, subtitulo, generado, alProgreso },
      dependenciasReales(async (todas) => {
        const { blob } = await buildOrdenTareaAlmacenLandscapePdfBlob(todas, { codigoCuenta });
        return new Uint8Array(await blob.arrayBuffer());
      }),
    );
    // Con varios envíos, la vista previa es la primera parte: trae el resumen de todo y las primeras OV.
    return { blob: partes[0]!.pdf!, hojas, resumen, nombreArchivo: nombreArchivoBatch(), resumenPdf, partes };
  }

  // Cada correo admite ~3 MB (REQ-186): si el paquete pesa más se manda en partes. Con pocas hojas
  // cabe de sobra y no se mide; con muchas se mide el peso real por hoja con un PDF de prueba.
  const orden = ordenDeImpresion({ hojas, resumen });
  let bytesPorHoja: number | null = null;
  if (hojas.length > HOJAS_QUE_SIEMPRE_CABEN) {
    alProgreso("Midiendo el tamaño del paquete…");
    const medida = await buildOrdenTareaAlmacenLandscapePdfBlob(hojas, { codigoCuenta });
    bytesPorHoja = medida.blob.size / hojas.length;
  }
  const partes = partirPaquete({ hojas, orden, bytesPorHoja });
  // El resumen lista lo mismo que lleva el PDF, en el mismo orden, y va de primera hoja.
  // Siempre va: no es un tipo que se elija sino la primera hoja de toda impresión rápida.
  const resumenPdf = armarResumenImpresion({
    orden,
    hojas,
    subtitulo: `${subtitulo}${partes.length > 1 ? ` · en ${partes.length} partes` : ""}`,
    generado,
    parteDeOv: partes.length > 1 ? parteDeCadaOv(partes) : undefined,
  });
  const { blob } = await buildOrdenTareaAlmacenLandscapePdfBlob(hojas, { codigoCuenta, resumen: resumenPdf });
  return { blob, hojas, resumen, nombreArchivo: nombreArchivoBatch(), resumenPdf, partes };
}
