import { PDFDocument } from "pdf-lib";
import { pdfDeExcel } from "./excel-a-pdf";
import { pdfDeHtml } from "./html-a-pdf";
import type { DocumentoOc, OcDeOv } from "./oc-documentos";

/** Una OC de 200 páginas no es una orden de compra: se avisa en vez de llenar el paquete. */
export const MAX_PAGINAS_POR_DOCUMENTO = 40;

export interface DocumentoPdf {
  nombre: string;
  bytes: Uint8Array;
  paginas: number;
}

export interface OcPreparada {
  /** Las OC de la OV ya convertidas a PDF, en el orden en que están guardadas. */
  documentos: DocumentoPdf[];
  /** Total de páginas de `documentos`. */
  paginas: number;
  /** Lo que no se pudo imprimir y por qué, para decirlo en el resumen. */
  avisos: string[];
}

export interface DependenciasOc {
  bajar: (url: string) => Promise<ArrayBuffer>;
  pdfDeHtml: (html: string, nombre: string) => Promise<Uint8Array>;
  pdfDeExcel: (contenido: ArrayBuffer, nombre: string) => Uint8Array;
}

/** El archivo sale del proxy del api, que usa la sesión de quien está en pantalla. */
export async function bajarArchivo(url: string): Promise<ArrayBuffer> {
  const respuesta = await fetch(url, { credentials: "same-origin", cache: "no-store" });
  if (!respuesta.ok) throw new Error(`el servidor respondió ${respuesta.status}`);
  return respuesta.arrayBuffer();
}

const DEPENDENCIAS_REALES: DependenciasOc = {
  bajar: bajarArchivo,
  pdfDeHtml,
  pdfDeExcel,
};

/** Algunos PDF traen unos bytes antes de la cabecera; basta con que `%PDF-` aparezca al inicio. */
function pareceUnPdf(bytes: Uint8Array): boolean {
  return new TextDecoder("latin1").decode(bytes.subarray(0, 1024)).includes("%PDF-");
}

async function contarPaginas(bytes: Uint8Array): Promise<number> {
  const documento = await PDFDocument.load(bytes, { updateMetadata: false });
  return documento.getPageCount();
}

async function aPdf(documento: DocumentoOc, contenido: ArrayBuffer, deps: DependenciasOc): Promise<Uint8Array> {
  if (documento.tipo === "pdf") {
    const bytes = new Uint8Array(contenido);
    if (!pareceUnPdf(bytes)) throw new Error("no es un PDF válido");
    return bytes;
  }
  if (documento.tipo === "excel") return deps.pdfDeExcel(contenido, documento.nombre);
  return deps.pdfDeHtml(new TextDecoder("utf-8").decode(contenido), documento.nombre);
}

/**
 * Baja las OC de una OV y las deja como PDF. Lo que falla (no se baja, no se puede leer, está
 * cifrado, es demasiado largo) no detiene a los demás: queda anotado en `avisos` con el nombre del
 * archivo, para que el resumen diga qué OC no salió.
 */
export async function prepararOcDeOv(
  oc: OcDeOv,
  deps: DependenciasOc = DEPENDENCIAS_REALES,
): Promise<OcPreparada> {
  const resultado: OcPreparada = { documentos: [], paginas: 0, avisos: [] };

  for (const omitido of oc.omitidos) {
    resultado.avisos.push(
      omitido.motivo === "sin_archivo"
        ? `${omitido.nombre}: solo quedó el nombre del archivo, no hay de dónde bajarlo.`
        : `${omitido.nombre}: pesa más de 10 MB.`,
    );
  }

  for (const documento of oc.documentos) {
    try {
      const contenido = await deps.bajar(documento.url);
      const bytes = await aPdf(documento, contenido, deps);
      const paginas = await contarPaginas(bytes);
      if (paginas > MAX_PAGINAS_POR_DOCUMENTO) {
        throw new Error(`tiene ${paginas} páginas y el máximo es ${MAX_PAGINAS_POR_DOCUMENTO}`);
      }
      resultado.documentos.push({ nombre: documento.nombre, bytes, paginas });
      resultado.paginas += paginas;
    } catch (error: unknown) {
      const motivo = error instanceof Error ? error.message : "no se pudo leer";
      resultado.avisos.push(`${documento.nombre}: ${motivo}.`);
    }
  }
  return resultado;
}
