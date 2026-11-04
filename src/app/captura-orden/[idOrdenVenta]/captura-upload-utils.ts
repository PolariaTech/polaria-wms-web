import { compressImageFile } from "@/lib/images/compress-image-file";

/** Límite de lo que se acepta del celular; más pesado que esto no se intenta subir. */
export const MAX_SELECT_BYTES = 10 * 1024 * 1024;
/** Objetivo de compresión: el proxy de Vercel corta cerca de 4,5 MB. */
const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
/** Si comprimir tarda más que esto (HEIC, equipos lentos), se sube el original. */
const ESPERA_COMPRESION_MS = 10_000;

export const MENSAJE_FOTO_PESADA =
  "La foto supera 10 MB y no se pudo comprimir lo suficiente. Tómala de nuevo más cerca o con menos resolución.";

export function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

/** Quita de la URL el resultado de una captura anterior (captura, msg, precision). */
export function clearCapturaQueryFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of ["captura", "msg", "precision"]) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState(
        {},
        "",
        url.pathname + (url.search ? url.search : ""),
      );
    }
  } catch {
    /* ignore */
  }
}

export function readFirstFile(
  ...inputs: Array<HTMLInputElement | null>
): File | null {
  for (const input of inputs) {
    const file = input?.files?.[0] ?? input?.files?.item?.(0) ?? null;
    if (file) return file;
  }
  return null;
}

export function mensajeErrorRespuesta(
  data: { error?: string; codigo?: string },
  status: number,
): string {
  if (typeof data.error === "string" && data.error.trim()) {
    return data.error.trim();
  }
  if (status === 422) {
    return "La foto fue tomada mal. Intenta de nuevo: la hoja debe verse clara dentro del marco.";
  }
  if (status === 413 || status === 400) {
    return "La foto no se pudo enviar. Tómala de nuevo más liviana o con mejor encuadre.";
  }
  if (status >= 500) {
    return "Mateo no pudo analizar la foto ahora. Espera un momento e intenta de nuevo.";
  }
  if (status === 0) {
    return "Error de red al subir. Revisa la conexión e inténtalo de nuevo.";
  }
  return `No se pudo procesar la foto (${status}). Intenta de nuevo.`;
}

export function mensajeErrorCamara(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Permiso de cámara denegado. Actívalo en Ajustes (Safari/Chrome) o elige una foto de la galería.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No se encontró cámara trasera. Prueba de nuevo o elige una foto de la galería.";
  }
  return "No se pudo abrir la cámara con marco. Elige una foto de la galería.";
}

export interface RespuestaEnvio {
  ok: boolean;
  status: number;
  data: { ok?: boolean; error?: string; codigo?: string; idIntento?: string };
}

/**
 * Envía la foto (o pide reintentar una ya guardada, sin cuerpo). El servidor responde 202
 * con `idIntento` en cuanto la recibe; la lectura con IA sigue después en segundo plano.
 */
export async function enviarFoto(url: string, body?: FormData): Promise<RespuestaEnvio> {
  const response = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json" },
    body,
  });
  const data = (await response.json().catch(() => ({}))) as RespuestaEnvio["data"];
  return { ok: response.ok, status: response.status, data };
}

/** Comprime para subir; si falla o tarda demasiado, devuelve el original. */
export async function prepararFoto(original: File): Promise<File> {
  try {
    return await Promise.race([
      compressImageFile(original, {
        maxBytes: MAX_UPLOAD_BYTES,
        maxEdge: 2400,
        quality: 0.88,
      }),
      new Promise<File>((resolve) => {
        window.setTimeout(() => resolve(original), ESPERA_COMPRESION_MS);
      }),
    ]);
  } catch {
    return original;
  }
}
