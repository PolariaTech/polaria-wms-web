import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { ResumenImpresionPdf } from "../print/render-resumen-impresion-pdf";
import { diaEntregaDeOv, type ResumenOvBatch } from "./batch-seleccion";

/** `YYYY-MM-DD` → `DD/MM/AAAA`, como lo muestran las hojas; vacío si no hay fecha. */
function fechaCorta(dia: string): string {
  return dia ? `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}` : "";
}

/** `[1,2,3,5]` → «1-3, 5»: las OT de una OV agrupadas en rangos. */
export function rangosDeOt(ots: readonly number[]): string {
  const partes: string[] = [];
  for (let i = 0; i < ots.length; ) {
    let j = i;
    while (j + 1 < ots.length && ots[j + 1] === ots[j]! + 1) j += 1;
    partes.push(j - i >= 2 ? `${ots[i]}-${ots[j]}` : ots.slice(i, j + 1).join(", "));
    i = j + 1;
  }
  return partes.join(", ");
}

/** de resumen que abre el PDF: una fila por OV, en el orden en que salen sus
 * hojas, con cuántas OT y cuántas hojas lleva cada una (una OT con muchos renglones usa varias).
 */
export function armarResumenImpresion(input: {
  /** OV en el orden de impresión (el de `ordenDeImpresion`). */
  orden: readonly ResumenOvBatch[];
  hojas: readonly OrdenTareaAlmacenPrintData[];
  subtitulo: string;
  generado: string;
  /** En qué envío sale cada OV (`idOrdenVenta` → parte desde 1), si el paquete se parte por tamaño. */
  parteDeOv?: ReadonlyMap<string, number>;
  /**
   * Si el paquete lleva OC: por OV, cuántas páginas de OC van y qué no se pudo imprimir. Una OV sin
   * ninguna OC y sin avisos recibe una nota que lo dice, para que no parezca un olvido.
   */
  ocPorOv?: ReadonlyMap<string, { paginas: number; avisos: readonly string[] }>;
}): ResumenImpresionPdf {
  const { orden, hojas, subtitulo, generado, parteDeOv, ocPorOv } = input;
  const hojasPorOv = new Map<string, number>();
  for (const hoja of hojas) {
    const id = hoja.idOrdenVenta ?? "";
    hojasPorOv.set(id, (hojasPorOv.get(id) ?? 0) + 1);
  }
  const notas: string[] = [];
  const filas = orden.map(({ row, ots }) => {
    const oc = ocPorOv?.get(row.idOrdenVenta);
    if (oc) {
      for (const aviso of oc.avisos) notas.push(`${row.venta}: ${aviso}`);
      if (oc.paginas === 0 && oc.avisos.length === 0) {
        notas.push(`${row.venta}: no tiene OC para imprimir (adjuntos HTML, PDF o Excel).`);
      }
    }
    return {
      venta: row.venta,
      cliente: row.comprador,
      entrega: fechaCorta(diaEntregaDeOv(row)),
      ot: ots.length,
      otLista: rangosDeOt(ots),
      hojas: hojasPorOv.get(row.idOrdenVenta) ?? ots.length,
      ...(oc && oc.paginas > 0 ? { oc: oc.paginas } : {}),
      ...(parteDeOv?.has(row.idOrdenVenta) ? { parte: parteDeOv.get(row.idOrdenVenta) } : {}),
    };
  });
  return {
    titulo: "Resumen de impresión",
    subtitulo,
    generado,
    filas,
    ...(notas.length > 0 ? { notas } : {}),
  };
}
