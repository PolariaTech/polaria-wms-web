import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import {
  paginasDeResumen,
  type ResumenImpresionPdf,
} from "../print/render-resumen-impresion-pdf";
import type { ResumenOvBatch } from "./batch-seleccion";
import type { ParteEnvio } from "./partir-paquete";

/** Lo que se muestra en la vista previa: el PDF ya armado y de qué sale. */
export interface PreviaBatch {
  blob: Blob;
  hojas: OrdenTareaAlmacenPrintData[];
  resumen: ResumenOvBatch[];
  nombreArchivo: string;
  /** Hoja de resumen que abre el PDF; solo la impresión rápida la lleva. */
  resumenPdf?: ResumenImpresionPdf;
  /** Cómo se manda cuando pesa más del límite de un correo; sin esto va todo en un solo envío. */
  partes?: ParteEnvio[];
}

/** Páginas del resumen, contando la hoja de notas si la lleva. */
export function paginasDelResumen(resumenPdf: ResumenImpresionPdf | undefined): number {
  return resumenPdf ? paginasDeResumen(resumenPdf.filas.length, resumenPdf.notas?.length ?? 0) : 0;
}

/** Hojas físicas que salen de la impresora: las de OT, las del resumen y las páginas de OC. */
export function hojasDelPaquete(previa: Pick<PreviaBatch, "hojas" | "resumenPdf" | "partes">): number {
  const deOc = (previa.partes ?? []).reduce((suma, parte) => suma + (parte.paginasExtra ?? 0), 0);
  return previa.hojas.length + paginasDelResumen(previa.resumenPdf) + deOc;
}

export function nombreArchivoBatch(ahora = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, "0");
  return `impresion-batch-${ahora.getFullYear()}${dos(ahora.getMonth() + 1)}${dos(ahora.getDate())}-${dos(ahora.getHours())}${dos(ahora.getMinutes())}.pdf`;
}

/** Hora actual en la zona de la cuenta, para decir cuándo se envió. */
export function horaEnCuenta(zonaHoraria: string, ahora = new Date()): string {
  const formato = { hour: "numeric", minute: "2-digit" } as const;
  try {
    return ahora.toLocaleTimeString("es-CO", { ...formato, timeZone: zonaHoraria });
  } catch {
    return ahora.toLocaleTimeString("es-CO", formato);
  }
}

/** Día de hoy `YYYY-MM-DD` en la zona de la cuenta (la fecha que propone la impresión rápida). */
export function hoyEnCuenta(zonaHoraria: string, ahora = new Date()): string {
  try {
    return ahora.toLocaleDateString("en-CA", { timeZone: zonaHoraria });
  } catch {
    return ahora.toLocaleDateString("en-CA");
  }
}

/** OV en el orden en que salen sus hojas en el PDF, cada una con sus OT elegidas. */
export function ordenDeImpresion(
  previa: Pick<PreviaBatch, "hojas" | "resumen">,
): ResumenOvBatch[] {
  const porId = new Map(previa.resumen.map((item) => [item.row.idOrdenVenta, item]));
  const vistas = new Set<string>();
  const orden: ResumenOvBatch[] = [];
  for (const hoja of previa.hojas) {
    const id = hoja.idOrdenVenta ?? "";
    const item = porId.get(id);
    if (item && !vistas.has(id)) {
      vistas.add(id);
      orden.push(item);
    }
  }
  return orden;
}
