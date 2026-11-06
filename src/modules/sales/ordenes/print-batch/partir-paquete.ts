import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { ResumenOvBatch } from "./batch-seleccion";

/** Peso máximo de cada PDF que se manda (REQ-186, sección 5 del análisis: ~3 MB por correo). */
export const LIMITE_PARTE_BYTES = 3 * 1024 * 1024;

/**
 * El peso por hoja es un promedio (las hojas con más renglones pesan algo más): se llena cada parte
 * solo hasta este porcentaje del límite para que ninguna lo pase.
 */
const MARGEN = 0.85;

/**
 * Medido (REQ-186 y 2026-11-05): una hoja comprimida pesa 9-10 KB. Con tantas hojas el paquete ocupa
 * ~1,5 MB, la mitad del límite, así que cabe en una sola parte sin medirlo.
 */
export const HOJAS_QUE_SIEMPRE_CABEN = 150;

/** Un envío: las hojas que lleva y las OV a las que pertenecen, en el orden de impresión. */
export interface ParteEnvio {
  hojas: OrdenTareaAlmacenPrintData[];
  resumen: ResumenOvBatch[];
  /** Páginas de OC (adjuntos HTML, PDF o Excel) que van en esta parte, además de las hojas de OT. */
  paginasExtra?: number;
  /** El PDF de esta parte ya armado (con OC). Sin él, el envío arma el PDF a partir de `hojas`. */
  pdf?: Blob;
}

/** Lo que las OC de una OV suman al paquete: peso del archivo ya convertido y páginas. */
export interface ExtraDeOv {
  bytes: number;
  paginas: number;
}

/**
 * Parte el paquete en envíos de peso acotado. Nunca corta una OV (sus hojas y sus OC van juntas) y
 * conserva el orden. Una OV que sola pese más que el límite va en su propia parte: no se puede
 * dividir. Sin peso medido (`null`) ni OC, todo va en una sola parte.
 */
export function partirPaquete(input: {
  hojas: readonly OrdenTareaAlmacenPrintData[];
  /** OV en el orden en que salen sus hojas. */
  orden: readonly ResumenOvBatch[];
  bytesPorHoja: number | null;
  /** Peso y páginas de las OC de cada OV (`idOrdenVenta`), si el paquete las lleva. */
  extraPorOv?: ReadonlyMap<string, ExtraDeOv>;
  limiteBytes?: number;
}): ParteEnvio[] {
  const { hojas, orden, bytesPorHoja, extraPorOv, limiteBytes = LIMITE_PARTE_BYTES } = input;
  const todo: ParteEnvio = { hojas: [...hojas], resumen: [...orden] };
  const porHoja = bytesPorHoja !== null && bytesPorHoja > 0 ? bytesPorHoja : 0;
  const conOc = Boolean(extraPorOv && extraPorOv.size > 0);
  if ((porHoja === 0 && !conOc) || orden.length === 0) return [todo];

  const hojasPorOv = new Map<string, OrdenTareaAlmacenPrintData[]>();
  for (const hoja of hojas) {
    const id = hoja.idOrdenVenta ?? "";
    hojasPorOv.set(id, [...(hojasPorOv.get(id) ?? []), hoja]);
  }

  const capacidad = limiteBytes * MARGEN;
  const partes: ParteEnvio[] = [];
  const nueva = (): ParteEnvio => ({ hojas: [], resumen: [], ...(conOc ? { paginasExtra: 0 } : {}) });
  let actual = nueva();
  let peso = 0;
  for (const item of orden) {
    const id = item.row.idOrdenVenta;
    const propias = hojasPorOv.get(id) ?? [];
    const extra = extraPorOv?.get(id);
    const pesoOv = propias.length * porHoja + (extra?.bytes ?? 0);
    if (actual.hojas.length > 0 && peso + pesoOv > capacidad) {
      partes.push(actual);
      actual = nueva();
      peso = 0;
    }
    actual.hojas.push(...propias);
    actual.resumen.push(item);
    if (conOc) actual.paginasExtra = (actual.paginasExtra ?? 0) + (extra?.paginas ?? 0);
    peso += pesoOv;
  }
  if (actual.resumen.length > 0) partes.push(actual);
  return partes.length > 0 ? partes : [todo];
}

/** Número de parte (1-based) de cada OV, para que el resumen diga en qué parte sale cada una. */
export function parteDeCadaOv(partes: readonly ParteEnvio[]): Map<string, number> {
  const mapa = new Map<string, number>();
  partes.forEach((parte, indice) => {
    for (const item of parte.resumen) mapa.set(item.row.idOrdenVenta, indice + 1);
  });
  return mapa;
}

/**
 * Hojas que faltan por mandar a partir de la parte `desde` (0-based). La portada de resumen solo
 * cuenta si todavía no se mandó la primera parte, que es la que la lleva.
 */
export function hojasPorEnviar(
  partes: readonly ParteEnvio[],
  desde: number,
  paginasResumen: number,
): number {
  const deLasPartes = partes
    .slice(desde)
    .reduce((suma, parte) => suma + parte.hojas.length + (parte.paginasExtra ?? 0), 0);
  return deLasPartes + (desde === 0 ? paginasResumen : 0);
}
