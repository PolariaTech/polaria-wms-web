import type { ResumenOvBatch } from "./batch-seleccion";
import type { ParteEnvio } from "./partir-paquete";
import { paginasDePdf, unirPdfs } from "./unir-pdfs";
import { paginasDelResumen, type PreviaBatch } from "./utilidades-batch";

export interface AnexoPrefactura {
  idOrdenVenta: string;
  pdf: Blob;
}

async function bytesDe(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

function bytesParaBlob(bytes: Uint8Array): ArrayBuffer {
  const copia = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copia).set(bytes);
  return copia;
}

/** Pega al PDF base las prefacturas de esas OV. Sin anexos devuelve el mismo blob. */
export async function pegarPrefacturas(
  base: Blob,
  ids: readonly string[],
  anexos: readonly AnexoPrefactura[] | undefined,
): Promise<Blob> {
  const pedidas = new Set(ids);
  const extras = (anexos ?? []).filter((anexo) => pedidas.has(anexo.idOrdenVenta));
  if (extras.length === 0) return base;
  const partes = [await bytesDe(base)];
  for (const extra of extras) partes.push(await bytesDe(extra.pdf));
  return new Blob([bytesParaBlob(await unirPdfs(partes))], { type: "application/pdf" });
}

type ArmarParte = (parte: ParteEnvio, indice: number, total: number) => Promise<Blob>;

async function paginasAnexas(ids: readonly string[], anexos: readonly AnexoPrefactura[]): Promise<number> {
  const pedidas = new Set(ids);
  let paginas = 0;
  for (const anexo of anexos) {
    if (pedidas.has(anexo.idOrdenVenta)) paginas += await paginasDePdf(await bytesDe(anexo.pdf));
  }
  return paginas;
}

async function parteLista(
  parte: ParteEnvio,
  indice: number,
  total: number,
  anexos: readonly AnexoPrefactura[],
  resumenPdf: PreviaBatch["resumenPdf"],
  armarParte: ArmarParte,
): Promise<ParteEnvio> {
  const ids = parte.resumen.map((item) => item.row.idOrdenVenta);
  const base = parte.pdf ?? (await armarParte(parte, indice, total));
  const pdf = await pegarPrefacturas(base, ids, anexos);
  let paginasExtra = (parte.paginasExtra ?? 0) + (await paginasAnexas(ids, anexos));
  if (!parte.pdf && indice === 0 && resumenPdf) paginasExtra += paginasDelResumen(resumenPdf);
  return { ...parte, pdf, paginasExtra };
}

/** Cierra cada parte con su PDF, prefacturas incluidas, para que el envío lo mande tal cual. */
export async function sumarPrefacturas(
  previa: PreviaBatch,
  anexos: readonly AnexoPrefactura[],
  armarParte: ArmarParte,
): Promise<PreviaBatch> {
  const partes = previa.partes ?? [{ hojas: previa.hojas, resumen: previa.resumen }];
  const yaTraiaPdf = partes.some((parte) => parte.pdf);
  const siguientes: ParteEnvio[] = [];
  for (let i = 0; i < partes.length; i += 1) {
    siguientes.push(await parteLista(partes[i]!, i, partes.length, anexos, yaTraiaPdf ? undefined : previa.resumenPdf, armarParte));
  }
  return {
    ...previa,
    blob: siguientes[0]?.pdf ?? previa.blob,
    partes: siguientes,
    resumenPdf: yaTraiaPdf ? previa.resumenPdf : undefined,
  };
}

/** Solo prefacturas: el PDF que se ve es el que se manda, sin hojas de orden de tarea. */
export async function previaSoloPrefacturas(resumen: ResumenOvBatch[], anexos: readonly AnexoPrefactura[], nombreArchivo: string): Promise<PreviaBatch> {
  const unido = await unirPdfs(await Promise.all(anexos.map((anexo) => bytesDe(anexo.pdf))));
  const blob = new Blob([bytesParaBlob(unido)], { type: "application/pdf" });
  return {
    blob,
    hojas: [],
    resumen,
    nombreArchivo,
    partes: [{ hojas: [], resumen, pdf: blob, paginasExtra: await paginasDePdf(unido) }],
  };
}
