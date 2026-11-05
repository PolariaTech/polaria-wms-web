import { construirPdfResumen, type ResumenImpresionPdf } from "../print/render-resumen-impresion-pdf";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type { ResumenOvBatch } from "./batch-seleccion";
import { ensamblarPaquete, type BloqueOv } from "./ensamblar-paquete";
import { ocDeOv } from "./oc-documentos";
import {
  parteDeCadaOv,
  partirPaquete,
  type ExtraDeOv,
  type ParteEnvio,
} from "./partir-paquete";
import { prepararOcDeOv, type OcPreparada } from "./preparar-oc";
import { armarResumenImpresion } from "./resumen-impresion";
import { ordenDeImpresion } from "./utilidades-batch";

/** Cuántas OV bajan sus OC a la vez: rápido sin saturar el proxy ni el navegador. */
const OV_EN_PARALELO = 4;

export interface PaqueteConOc {
  /** Los envíos, cada uno con su PDF ya armado (resumen, OT y OC). */
  partes: ParteEnvio[];
  resumenPdf: ResumenImpresionPdf;
}

export interface DependenciasPaquete {
  prepararOc: (origenArchivos: string | null | undefined) => Promise<OcPreparada>;
  /** PDF con todas las hojas de OT, en orden, una página por hoja. */
  construirBaseOt: (hojas: readonly OrdenTareaAlmacenPrintData[]) => Promise<Uint8Array>;
}

/** Lo de verdad: baja las OC por el proxy y arma la base de OT con el generador de hojas de la cuenta. */
export function dependenciasReales(construirBaseOt: DependenciasPaquete["construirBaseOt"]): DependenciasPaquete {
  return {
    prepararOc: (origen) => prepararOcDeOv(ocDeOv(origen)),
    construirBaseOt,
  };
}

/** Procesa `items` de a `limite` a la vez, conservando el orden del resultado. */
async function conLimite<T, R>(items: readonly T[], limite: number, tarea: (item: T) => Promise<R>): Promise<R[]> {
  const resultados = new Array<R>(items.length);
  let siguiente = 0;
  async function trabajador(): Promise<void> {
    while (siguiente < items.length) {
      const indice = siguiente;
      siguiente += 1;
      resultados[indice] = await tarea(items[indice]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, items.length) }, trabajador));
  return resultados;
}

/**
 * Arma el paquete de la impresión rápida con las OC originales (REQ-260): baja y convierte las OC de
 * cada OV, mide el paquete, lo parte en envíos de peso acotado y ensambla el PDF de cada uno. Cada
 * OV va con sus hojas de OT y detrás sus OC; el resumen, de primera hoja del primer envío.
 */
export async function armarPaqueteConOc(
  input: {
    hojas: readonly OrdenTareaAlmacenPrintData[];
    /** Las OV elegidas con sus OT, para saber el orden. */
    resumen: readonly ResumenOvBatch[];
    /** `origen_archivos` de cada OV (`idOrdenVenta`), tal como lo guarda la base. */
    origenPorOv: ReadonlyMap<string, string | null | undefined>;
    /** Texto de arriba del resumen, sin la parte de los envíos (eso lo agrega el paquete). */
    subtitulo: string;
    generado: string;
    alProgreso?: (texto: string) => void;
  },
  deps: DependenciasPaquete,
): Promise<PaqueteConOc> {
  const { hojas, resumen, origenPorOv, subtitulo, generado, alProgreso } = input;
  const orden = ordenDeImpresion({ hojas: [...hojas], resumen: [...resumen] });

  let listas = 0;
  const ocs = await conLimite(orden, OV_EN_PARALELO, async (item) => {
    const preparada = await deps.prepararOc(origenPorOv.get(item.row.idOrdenVenta));
    listas += 1;
    alProgreso?.(`Bajando órdenes de compra: ${listas} de ${orden.length}…`);
    return preparada;
  });
  const ocPorOv = new Map(orden.map((item, i) => [item.row.idOrdenVenta, ocs[i]!]));

  alProgreso?.("Midiendo el tamaño del paquete…");
  const baseOt = await deps.construirBaseOt(hojas);
  const bytesPorHoja = baseOt.byteLength / Math.max(1, hojas.length);
  const extraPorOv = new Map<string, ExtraDeOv>(
    [...ocPorOv].map(([id, oc]) => [id, { bytes: oc.documentos.reduce((s, d) => s + d.bytes.byteLength, 0), paginas: oc.paginas }]),
  );
  const partes = partirPaquete({ hojas, orden, bytesPorHoja, extraPorOv });

  const resumenPdf = armarResumenImpresion({
    orden,
    hojas,
    subtitulo: `${subtitulo}${partes.length > 1 ? ` · en ${partes.length} partes` : ""}`,
    generado,
    parteDeOv: partes.length > 1 ? parteDeCadaOv(partes) : undefined,
    ocPorOv: new Map([...ocPorOv].map(([id, oc]) => [id, { paginas: oc.paginas, avisos: oc.avisos }])),
  });

  alProgreso?.("Armando el PDF…");
  const hojasPorOv = new Map<string, number>();
  for (const hoja of hojas) {
    const id = hoja.idOrdenVenta ?? "";
    hojasPorOv.set(id, (hojasPorOv.get(id) ?? 0) + 1);
  }
  let inicioOt = 0;
  const conPdf: ParteEnvio[] = [];
  for (const [indice, parte] of partes.entries()) {
    const bloques: BloqueOv[] = parte.resumen.map((item) => ({
      hojasOt: hojasPorOv.get(item.row.idOrdenVenta) ?? 0,
      oc: (ocPorOv.get(item.row.idOrdenVenta)?.documentos ?? []).map((d) => d.bytes),
    }));
    const pdf = await ensamblarPaquete({
      resumen: indice === 0 ? construirPdfResumen(resumenPdf) : null,
      ot: baseOt,
      inicioOt,
      ovs: bloques,
    });
    inicioOt += parte.hojas.length;
    conPdf.push({ ...parte, pdf: new Blob([pdf as BlobPart], { type: "application/pdf" }) });
  }
  return { partes: conPdf, resumenPdf };
}
