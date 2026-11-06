import type { OrdenTareaAlmacenPrintData } from "./orden-tarea-almacen.types";

/** Una orden de trabajo de la OV tal como la ve quien elige qué imprimir o descargar. */
export interface OtParaElegir {
  /** Número de la OT dentro de la OV (el `tareaIndex` de la hoja, desde 1). */
  numero: number;
  /** Cuántas OT tiene la OV, para decir «OT 2 de 5». */
  total: number;
  /** Centro de consumo, para que se reconozca cuál es; vacío si la OT no lo tiene. */
  centro: string;
  renglones: number;
  /** Una OT con muchos renglones ocupa varias hojas. */
  hojas: number;
}

function numeroDeOt(hoja: OrdenTareaAlmacenPrintData): number {
  return hoja.tareaIndex && hoja.tareaIndex > 0 ? hoja.tareaIndex : 1;
}

/** Junta las hojas de la OV por OT, de la primera a la última. */
export function agruparHojasPorOt(
  hojas: readonly OrdenTareaAlmacenPrintData[],
): OtParaElegir[] {
  const porOt = new Map<number, OtParaElegir>();
  for (const hoja of hojas) {
    const numero = numeroDeOt(hoja);
    const previa = porOt.get(numero);
    porOt.set(numero, {
      numero,
      total: 0,
      centro: previa?.centro || (hoja.centroConsumo ?? "").trim(),
      renglones: (previa?.renglones ?? 0) + hoja.lineas.length,
      hojas: (previa?.hojas ?? 0) + 1,
    });
  }
  const lista = [...porOt.values()].sort((a, b) => a.numero - b.numero);
  // El total lo dice la hoja; si falta, vale la OT más alta que aparece.
  const declarado = Math.max(0, ...hojas.map((hoja) => hoja.tareaTotal ?? 0));
  const total = Math.max(declarado, ...lista.map((ot) => ot.numero));
  return lista.map((ot) => ({ ...ot, total }));
}

/** Cuántas hojas salen con las OT elegidas. */
export function hojasDeLasOt(
  ots: readonly OtParaElegir[],
  elegidas: ReadonlySet<number>,
): number {
  return ots
    .filter((ot) => elegidas.has(ot.numero))
    .reduce((suma, ot) => suma + ot.hojas, 0);
}
