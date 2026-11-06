import {
  origenAdjuntoDownloadUrl,
  parseOrigenArchivos,
  type OrigenAdjunto,
} from "../utils/origen/origen-adjuntos";

/** Lo que REQ-260 pide imprimir junto a las OT: adjuntos HTML, PDF o XLS (no imágenes ni cuerpo del correo). */
export type TipoDocumentoOc = "pdf" | "html" | "excel";

export interface DocumentoOc {
  nombre: string;
  tipo: TipoDocumentoOc;
  /** Dirección desde la que se baja el archivo (proxy del api, con la sesión). */
  url: string;
  bytes: number | null;
}

export type MotivoOcOmitida = "sin_archivo" | "muy_grande";

export interface OcDeOv {
  /** Documentos que sí se imprimen, en el orden en que están guardados. */
  documentos: DocumentoOc[];
  /** Adjuntos del tipo pedido que no se pueden imprimir, y por qué. */
  omitidos: Array<{ nombre: string; motivo: MotivoOcOmitida }>;
}

/** Un adjunto más grande que esto no se baja: tarda y pesa en el PDF (el api también lo rechaza a los 15 MB). */
export const MAX_BYTES_DOCUMENTO_OC = 10 * 1024 * 1024;

/** Tope de documentos por OV: en JBR lo más que se ha visto son 7 PDF en una sola OV. */
export const MAX_DOCUMENTOS_OC_POR_OV = 12;

function tipoDe(adjunto: OrigenAdjunto): TipoDocumentoOc | null {
  const mime = (adjunto.mime ?? "").toLowerCase();
  const nombre = adjunto.nombre.toLowerCase();
  if (mime === "application/pdf" || nombre.endsWith(".pdf")) return "pdf";
  if (
    mime === "text/html" ||
    mime === "application/xhtml+xml" ||
    nombre.endsWith(".html") ||
    nombre.endsWith(".htm")
  ) {
    return "html";
  }
  if (
    mime.includes("spreadsheetml") ||
    mime === "application/vnd.ms-excel" ||
    /\.(xlsx|xlsm|xls)$/.test(nombre)
  ) {
    return "excel";
  }
  // El `.eml` (el correo entero), las imágenes (logos de firma) y lo demás no son la OC.
  return null;
}

/**
 * Las OC originales de una OV, sacadas de `orden_venta.origen_archivos`. Solo PDF, HTML y Excel:
 * es lo que pidió Andrés en REQ-260. Las OV viejas guardan solo el nombre del archivo, sin ruta:
 * ese documento existió pero ya no hay de dónde bajarlo, y se anota como omitido.
 */
export function ocDeOv(origenArchivos: string | null | undefined): OcDeOv {
  const resultado: OcDeOv = { documentos: [], omitidos: [] };
  for (const adjunto of parseOrigenArchivos(origenArchivos)) {
    const tipo = tipoDe(adjunto);
    if (!tipo) continue;
    const url = origenAdjuntoDownloadUrl(adjunto);
    if (!url) {
      resultado.omitidos.push({ nombre: adjunto.nombre, motivo: "sin_archivo" });
      continue;
    }
    const bytes = typeof adjunto.bytes === "number" ? adjunto.bytes : null;
    if (bytes !== null && bytes > MAX_BYTES_DOCUMENTO_OC) {
      resultado.omitidos.push({ nombre: adjunto.nombre, motivo: "muy_grande" });
      continue;
    }
    if (resultado.documentos.length >= MAX_DOCUMENTOS_OC_POR_OV) continue;
    resultado.documentos.push({ nombre: adjunto.nombre, tipo, url, bytes });
  }
  return resultado;
}
