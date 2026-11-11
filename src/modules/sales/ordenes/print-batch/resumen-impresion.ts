import { formatIsoToDdMonAbrev } from "@/lib/utils/fecha-dd-mm-yyyy";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { ResumenImpresionPdf } from "../print/render-resumen-impresion-pdf";
import { diaEntregaDeOv, type ResumenOvBatch } from "./batch-seleccion";

/** `YYYY-MM-DD` → `03-NOV` (sin año, para que la columna sea angosta); vacío si no hay fecha. */
function fechaCorta(dia: string): string {
  return formatIsoToDdMonAbrev(dia);
}

/** Los números de orden de compra del cliente que salen en las hojas de la OV, sin repetir. */
function ordenClienteDeHojas(hojas: readonly OrdenTareaAlmacenPrintData[]): string {
  const numeros = new Set<string>();
  for (const hoja of hojas) {
    const numero = hoja.numeroOrdenCliente?.trim();
    if (numero) numeros.add(numero);
  }
  return [...numeros].join(", ");
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
  const hojasPorOv = new Map<string, OrdenTareaAlmacenPrintData[]>();
  for (const hoja of hojas) {
    const id = hoja.idOrdenVenta ?? "";
    hojasPorOv.set(id, [...(hojasPorOv.get(id) ?? []), hoja]);
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
    const hojasDeOv = hojasPorOv.get(row.idOrdenVenta) ?? [];
    return {
      venta: row.venta,
      cliente: row.comprador,
      entrega: fechaCorta(diaEntregaDeOv(row)),
      ot: ots.length,
      ordenCliente: ordenClienteDeHojas(hojasDeOv),
      hojas: hojasDeOv.length || ots.length,
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
