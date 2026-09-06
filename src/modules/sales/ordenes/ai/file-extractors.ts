import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

const TEXT_EXTENSIONS = new Set([".csv", ".txt"]);
const IMAGE_MIME_PREFIX = "image/";
// .doc/.xls/.ppt viejos (formato OLE Compound File Binary) comparten la misma firma de
// magic bytes — no se pueden distinguir entre sí sin un parser más profundo.
const COMPOUND_BINARY_MIME = "application/x-cfb";

export interface ArchivoTexto {
  nombre: string;
  tipo: "texto";
  contenido: string;
}

export interface ArchivoImagen {
  nombre: string;
  tipo: "imagen";
  mime: string;
  base64: string;
}

export interface ArchivoNoLegible {
  nombre: string;
  tipo: "no_legible";
  motivo: string;
}

export type ArchivoExtraido = ArchivoTexto | ArchivoImagen | ArchivoNoLegible;

/** Forma mínima de archivo en memoria (sin depender de Express.Multer). */
export interface ArchivoSubido {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

async function extractFromPdf(buffer: Buffer): Promise<string> {
  // unpdf en vez de pdf-parse: pdf-parse (basado en un build vendored viejo de pdf.js)
  // corrompe su estado interno entre llamadas sucesivas en el mismo proceso — la
  // primera extracción de PDF del proceso funciona, la segunda devuelve texto casi
  // vacío y además lanza un unhandledRejection asíncrono que tumba el servidor
  // completo. Verificado con archivos reales (ver casos_de_uso/pdf/); unpdf no lo
  // reproduce ni en llamadas secuenciales ni concurrentes.
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim();
}

function extractFromExcel(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return `# Hoja: ${name}\n${csv}`;
  }).join("\n\n");
}

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

/**
 * AUDITORÍA 2026-09-03 · Hallazgo #8 (Medio) — el ruteo imagen-vs-texto se decidía
 * 100% por el `Content-Type` que declara el cliente en el multipart (spoofable) — en la
 * auditoría, un PDF real enviado con `Content-Type: image/png` fue ruteado como imagen y
 * llegó a la API de visión de OpenAI, que lo rechazó, gastando la llamada igual sin que
 * el backend lo hubiera podido evitar. Fix: se leen los magic bytes reales del contenido
 * (`file-type`, sniffing binario, no confía en nada declarado por el cliente) y esos
 * mandan sobre el mimetype/extensión declarados.
 * `file-type` v22 es ESM-only (sin build CJS) — se importa con `await import(...)`
 * dinámico en vez de `import` estático, porque este proyecto compila a CommonJS (mismo
 * motivo que obligó a usar import dinámico en su momento para `unpdf` antes de
 * confirmar que ese sí traía export dual).
 */
async function detectarTipoReal(
  buffer: Buffer,
): Promise<{ ext?: string; mime?: string }> {
  const { fileTypeFromBuffer } = await import("file-type");
  const resultado = await fileTypeFromBuffer(buffer);
  return resultado ? { ext: resultado.ext, mime: resultado.mime } : {};
}

/**
 * Convierte un archivo subido a la forma que necesita el prompt de OpenAI:
 * - texto: contenido plano legible (pdf/xlsx/xls/csv/txt/docx)
 * - imagen: base64 + mime, para mandarlo como content block de visión
 * - no_legible: formato sin parser disponible (ej. .doc legado)
 */
async function extractFile(file: ArchivoSubido): Promise<ArchivoExtraido> {
  const extDeclarada = path.extname(file.originalname).toLowerCase();
  const nombre = file.originalname;

  const real = await detectarTipoReal(file.buffer);
  // Si file-type no detecta nada (ej. texto plano — CSV/TXT no tienen firma binaria que
  // sniffear), se cae al mimetype declarado solo como último recurso posible, no por
  // confiar en el cliente sino porque no hay otra señal disponible.
  const esImagenReal = real.mime
    ? real.mime.startsWith(IMAGE_MIME_PREFIX)
    : file.mimetype.startsWith(IMAGE_MIME_PREFIX);

  if (esImagenReal) {
    return {
      nombre,
      tipo: "imagen",
      mime: real.mime ?? file.mimetype,
      base64: file.buffer.toString("base64"),
    };
  }

  // .doc/.xls viejos son ambiguos por firma (ver COMPOUND_BINARY_MIME) — ahí sí se
  // respeta la extensión declarada, es la única excepción documentada.
  const extReal =
    real.mime === COMPOUND_BINARY_MIME || !real.ext
      ? extDeclarada
      : `.${real.ext}`;

  try {
    if (extReal === ".pdf") {
      return {
        nombre,
        tipo: "texto",
        contenido: await extractFromPdf(file.buffer),
      };
    }
    if (extReal === ".xlsx" || extReal === ".xls") {
      return {
        nombre,
        tipo: "texto",
        contenido: extractFromExcel(file.buffer),
      };
    }
    if (extReal === ".docx") {
      return {
        nombre,
        tipo: "texto",
        contenido: await extractFromDocx(file.buffer),
      };
    }
    if (TEXT_EXTENSIONS.has(extDeclarada)) {
      return {
        nombre,
        tipo: "texto",
        contenido: file.buffer.toString("utf8"),
      };
    }
  } catch (err) {
    return { nombre, tipo: "no_legible", motivo: (err as Error).message };
  }

  return {
    nombre,
    tipo: "no_legible",
    motivo: "Formato sin lector disponible (ej. .doc)",
  };
}

export async function extractFiles(
  files: Array<{ originalname: string; mimetype: string; buffer: Buffer }> | undefined,
): Promise<ArchivoExtraido[]> {
  return Promise.all((files ?? []).map(extractFile));
}
