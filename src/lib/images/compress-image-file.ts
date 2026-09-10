/**
 * Comprime una imagen en el navegador (canvas) para no superar
 * el límite de payload de Vercel (~4.5 MB) en Serverless Functions.
 */

export interface CompressImageOptions {
  /** Lado mayor máximo en px. */
  maxEdge?: number;
  /** Calidad JPEG inicial (0–1). */
  quality?: number;
  /** Tamaño máximo del archivo resultante. */
  maxBytes?: number;
  /** Nombre del archivo de salida. */
  fileName?: string;
}

const DEFAULT_MAX_EDGE = 1800;
const DEFAULT_QUALITY = 0.72;
/** Margen bajo el límite Vercel 4.5 MB (multipart añade overhead). */
const DEFAULT_MAX_BYTES = 2.5 * 1024 * 1024;

function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen."));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

/**
 * Devuelve un JPEG redimensionado. Si el archivo ya es pequeño, lo deja igual
 * (salvo HEIC/otros no dibujables: intenta igual y si falla, regresa el original).
 */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  let quality = options.quality ?? DEFAULT_QUALITY;
  const outName =
    options.fileName ??
    (file.name?.replace(/\.[^.]+$/, "") || "foto") + ".jpg";

  if (file.size > 0 && file.size <= maxBytes && file.type === "image/jpeg") {
    // Igual puede ser muy grande en resolución; igual reescalamos si aplica.
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await loadImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await canvasToBlob(canvas, "image/jpeg", quality);
  while (blob.size > maxBytes && quality > 0.4) {
    quality = Math.max(0.4, quality - 0.1);
    blob = await canvasToBlob(canvas, "image/jpeg", quality);
  }

  if (blob.size > maxBytes && maxEdge > 1000) {
    const tighter = await compressImageFile(file, {
      ...options,
      maxEdge: Math.round(maxEdge * 0.75),
      quality: Math.max(0.45, quality),
      maxBytes,
      fileName: outName,
    });
    return tighter;
  }

  return new File([blob], outName, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/** Asigna el File al input vía DataTransfer (necesario en iOS/Safari). */
export function assignFileToInput(
  input: HTMLInputElement,
  file: File,
): void {
  const dt = new DataTransfer();
  dt.items.add(file);
  input.files = dt.files;
}
