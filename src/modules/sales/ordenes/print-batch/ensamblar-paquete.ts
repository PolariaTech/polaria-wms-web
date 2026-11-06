import { PDFDocument } from "pdf-lib";
import { numerarHojasPdfLib } from "../print/numerar-hojas-pdf";

/** Lo que va de una OV en el paquete: cuántas hojas de OT le tocan y las OC que se pegan detrás. */
export interface BloqueOv {
  /** Páginas de `ot` que son de esta OV (una por hoja de orden de tarea). */
  hojasOt: number;
  /** PDF de cada OC de la OV, en el orden en que salen. */
  oc: readonly Uint8Array[];
}

async function copiarPaginas(destino: PDFDocument, origen: PDFDocument, indices: number[]): Promise<void> {
  const copiadas = await destino.copyPages(origen, indices);
  for (const pagina of copiadas) destino.addPage(pagina);
}

/**
 * Arma el PDF que se manda a la impresora: el resumen de primera hoja y, por cada OV, sus hojas de
 * orden de tarea y detrás sus OC (como pidió Edgar: «la orden de tarea con su orden de compra» y
 * sigue la siguiente OV). `ot` trae todas las hojas de OT del paquete en el orden de `ovs`.
 */
export async function ensamblarPaquete(input: {
  resumen: Uint8Array | null;
  ot: Uint8Array;
  ovs: readonly BloqueOv[];
  /**
   * Primera página de `ot` que toca a estas OV. `ot` puede traer las hojas de todo el envío partido
   * y cada parte toma solo las suyas; sin esto se espera que `ot` sea justo lo de estas OV.
   */
  inicioOt?: number;
  /** «2/3» cuando el paquete se parte en envíos: sale en el número de cada hoja. */
  etiquetaParte?: string;
}): Promise<Uint8Array> {
  const { resumen, ot, ovs, inicioOt = 0, etiquetaParte } = input;
  const baseOt = await PDFDocument.load(ot, { updateMetadata: false });
  const esperadas = ovs.reduce((suma, bloque) => suma + bloque.hojasOt, 0);
  const disponibles = baseOt.getPageCount() - inicioOt;
  // Sin `inicioOt`, `ot` debe ser justo lo de estas OV; con él, basta con que alcance.
  const cuadra = input.inicioOt === undefined ? esperadas === disponibles : esperadas <= disponibles;
  if (!cuadra) {
    throw new Error(
      `El paquete trae ${disponibles} hojas de orden de tarea y las OV suman ${esperadas}.`,
    );
  }

  const paquete = await PDFDocument.create();
  if (resumen) {
    const portada = await PDFDocument.load(resumen, { updateMetadata: false });
    await copiarPaginas(paquete, portada, portada.getPageIndices());
  }

  let cursor = inicioOt;
  for (const bloque of ovs) {
    const hojas = Array.from({ length: bloque.hojasOt }, (_, i) => cursor + i);
    await copiarPaginas(paquete, baseOt, hojas);
    cursor += bloque.hojasOt;
    for (const documento of bloque.oc) {
      const origen = await PDFDocument.load(documento, { updateMetadata: false });
      await copiarPaginas(paquete, origen, origen.getPageIndices());
    }
  }
  // El número de hoja es el que usa la columna «Desde la hoja» del resumen: sin él no sirve de nada.
  await numerarHojasPdfLib(paquete, etiquetaParte);
  return paquete.save();
}
