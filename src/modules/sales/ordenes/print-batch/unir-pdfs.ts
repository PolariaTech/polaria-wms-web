import { PDFDocument } from "pdf-lib";

/** Junta varios PDF en uno, en el orden recibido. */
export async function unirPdfs(partes: readonly Uint8Array[]): Promise<Uint8Array> {
  if (partes.length === 0) throw new Error("No hay PDF para unir.");
  const destino = await PDFDocument.create();
  for (const parte of partes) {
    const origen = await PDFDocument.load(parte);
    const copiadas = await destino.copyPages(origen, origen.getPageIndices());
    for (const pagina of copiadas) destino.addPage(pagina);
  }
  return destino.save();
}

export async function paginasDePdf(bytes: Uint8Array): Promise<number> {
  return (await PDFDocument.load(bytes)).getPageCount();
}
