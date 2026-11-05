import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { ResumenOvBatch } from "./batch-seleccion";

/** Lo que se muestra en la vista previa: el PDF ya armado y de qué sale. */
export interface PreviaBatch {
  blob: Blob;
  hojas: OrdenTareaAlmacenPrintData[];
  resumen: ResumenOvBatch[];
  nombreArchivo: string;
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
