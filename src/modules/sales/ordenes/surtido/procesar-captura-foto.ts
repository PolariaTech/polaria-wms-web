import { uploadEvidenciaImage } from "@/lib/cloudinary/upload-evidencia";
import { extractFiles } from "../ai/file-extractors";
import { normalizeIdOrdenTrabajo } from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  guardarUrlFoto,
  marcarFallo,
  marcarLista,
  marcarProcesando,
  type RefIntento,
} from "./captura-intento.service";
import { estimateSurtidoPrecision } from "./estimate-surtido-precision";
import { extraerSurtidoDesdeFoto } from "./openai-surtido.client";
import {
  applySurtidoCapturaToOrdenVenta,
  buildPrintDataAdmin,
  syncOrdenVentaEstadoAlistamiento,
  upsertOrdenSurtidoCaptura,
} from "./orden-surtido.service";
import { evaluarCalidadFotoSurtido } from "./validate-surtido-foto-calidad";

/**
 * Lee la foto de una hoja de surtido y guarda el resultado (REQ-247).
 * Corre en segundo plano: el api responde en cuanto la foto está recibida.
 */

export interface EntradaFoto {
  idOrdenVenta: string;
  idOrdenTrabajo: string;
  codigoCuenta: string;
  buffer: Buffer;
  nombre: string;
  mime: string;
  /** En un reintento la foto ya está guardada: no se vuelve a subir. */
  urlFotoGuardada?: string | null;
  /** Se llama en cuanto la foto queda guardada, aunque la IA no llegue a terminar. */
  alSubirFoto?: (url: string) => void | Promise<void>;
}

type Tiempos = Record<string, number>;

export type ResultadoFoto =
  | {
      ok: true;
      idOrdenTrabajo: string;
      modelo: string;
      urlFoto: string | null;
      precisionEstimada: number;
      captura: unknown;
      estadoAlistamiento: string | null;
      ovSync: { updatedHeader: boolean; updatedLineas: number; error?: string };
      tiempos: Tiempos;
    }
  | {
      ok: false;
      status: number;
      codigo: string;
      error: string;
      detalle?: string;
      motivoIa?: string | null;
      precisionEstimada?: number;
      urlFoto: string | null;
      idOrdenTrabajo: string;
      tiempos: Tiempos;
    };

/** Errores de proceso → mensaje claro para el celular (sin «error de servidor»). */
export function mensajeErrorCaptura(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const lower = raw.toLowerCase();
  if (!raw.trim()) {
    return "No se pudo leer la foto. Intenta de nuevo con mejor luz.";
  }
  if (
    lower.includes("openai") ||
    lower.includes("api key") ||
    lower.includes("rate limit") ||
    lower.includes("timeout") ||
    lower.includes("etimedout") ||
    lower.includes("fetch failed")
  ) {
    return "Mateo no pudo analizar la foto ahora. Espera unos segundos e intenta de nuevo.";
  }
  if (lower.includes("json") || lower.includes("contenido")) {
    return "No se entendió la foto. Encaja la hoja en el marco e intenta de nuevo.";
  }
  if (raw.length <= 160 && !lower.includes("internal") && !lower.includes("500")) {
    return raw;
  }
  return "No se pudo procesar la foto. Revisa el encuadre (hoja clara en el marco) e intenta de nuevo.";
}

async function extraerSurtidoConReintento(
  input: Parameters<typeof extraerSurtidoDesdeFoto>[0],
): Promise<Awaited<ReturnType<typeof extraerSurtidoDesdeFoto>>> {
  try {
    return await extraerSurtidoDesdeFoto(input);
  } catch (firstError) {
    console.warn(
      "[captura-orden] OpenAI surtido falló, reintento 1×:",
      firstError instanceof Error ? firstError.message : firstError,
    );
    return extraerSurtidoDesdeFoto(input);
  }
}

/** Sube la foto a Cloudinary; si falla, la captura se guarda igual sin evidencia. */
async function subirEvidencia(entrada: EntradaFoto, mime: string): Promise<string | null> {
  try {
    const archivo = new File([new Uint8Array(entrada.buffer)], entrada.nombre, { type: mime });
    const subida = await uploadEvidenciaImage(archivo);
    return subida.ok ? subida.url : null;
  } catch {
    return null;
  }
}

export async function procesarFotoSurtido(entrada: EntradaFoto): Promise<ResultadoFoto> {
  const inicio = Date.now();
  const tiempos: Tiempos = {};
  let idOrdenTrabajo = entrada.idOrdenTrabajo;
  let urlFoto: string | null = entrada.urlFotoGuardada ?? null;
  let subida: Promise<void> = Promise.resolve();

  const medir = async <T>(clave: string, trabajo: () => Promise<T>): Promise<T> => {
    const desde = Date.now();
    try {
      return await trabajo();
    } finally {
      tiempos[clave] = Date.now() - desde;
    }
  };

  const fallo = async (
    status: number,
    codigo: string,
    error: string,
    extra: { detalle?: string; motivoIa?: string | null; precisionEstimada?: number } = {},
  ): Promise<ResultadoFoto> => {
    await subida;
    tiempos.total = Date.now() - inicio;
    return { ok: false, status, codigo, error, urlFoto, idOrdenTrabajo, tiempos, ...extra };
  };

  try {
    const extraidos = await extractFiles([
      { originalname: entrada.nombre, mimetype: entrada.mime, buffer: entrada.buffer },
    ]);
    const imagen = extraidos.find((item) => item.tipo === "imagen");
    if (!imagen || imagen.tipo !== "imagen") {
      return await fallo(400, "imagen_ilegible", "No se pudo leer la imagen. Prueba JPG desde la galería (no HEIC).");
    }

    const original = await medir("lectura_hoja", () =>
      buildPrintDataAdmin(entrada.idOrdenVenta, entrada.idOrdenTrabajo || null),
    );
    if (!original) return await fallo(404, "orden_no_encontrada", "Orden no encontrada.");
    idOrdenTrabajo = normalizeIdOrdenTrabajo(original.idOrdenTrabajo) || idOrdenTrabajo;

    // La foto se guarda mientras la IA la lee: así no se suma el tiempo de una y otra.
    if (!urlFoto) {
      subida = medir("cloudinary", () => subirEvidencia(entrada, imagen.mime)).then(async (url) => {
        urlFoto = url;
        if (url) await entrada.alSubirFoto?.(url);
      });
      subida = subida.catch(() => undefined);
    }

    const { payload: crudo, modelo } = await medir("ia", () =>
      extraerSurtidoConReintento({ original, mime: imagen.mime, base64: imagen.base64 }),
    );
    const precisionEstimada = estimateSurtidoPrecision(crudo, original.lineas.length);
    const payload = { ...crudo, precisionEstimada };

    const calidad = evaluarCalidadFotoSurtido(payload);
    if (!calidad.ok) {
      return await fallo(422, calidad.codigo, calidad.error, {
        motivoIa: payload.calidadFoto?.motivo || null,
        precisionEstimada,
      });
    }

    await subida;
    const captura = await medir("guardar", () =>
      upsertOrdenSurtidoCaptura({
        idOrdenVenta: entrada.idOrdenVenta,
        idOrdenTrabajo,
        codigoCuenta: entrada.codigoCuenta,
        urlFoto,
        payload,
        modelo,
      }),
    );

    const estadoOv = Date.now();
    let estadoAlistamiento: string | null = null;
    try {
      estadoAlistamiento = (
        await syncOrdenVentaEstadoAlistamiento({
          idOrdenVenta: entrada.idOrdenVenta,
          idOrdenTrabajo,
        })
      ).estado;
    } catch (estadoError) {
      console.error(
        "[captura-orden] sync estado alistamiento falló:",
        estadoError instanceof Error ? estadoError.message : estadoError,
      );
    }

    let ovSync: { updatedHeader: boolean; updatedLineas: number; error?: string };
    try {
      ovSync = await applySurtidoCapturaToOrdenVenta({
        idOrdenVenta: entrada.idOrdenVenta,
        idOrdenTrabajo,
        payload,
      });
    } catch (syncError) {
      const mensaje = syncError instanceof Error ? syncError.message : String(syncError);
      console.error("[captura-orden] sync OV desde surtido falló:", mensaje);
      ovSync = { updatedHeader: false, updatedLineas: 0, error: mensaje };
    }
    tiempos.estado_ov = Date.now() - estadoOv;
    tiempos.total = Date.now() - inicio;

    return {
      ok: true,
      idOrdenTrabajo,
      modelo,
      urlFoto,
      precisionEstimada,
      captura,
      estadoAlistamiento,
      ovSync,
      tiempos,
    };
  } catch (error) {
    const detalle = error instanceof Error ? error.message : "No se pudo procesar la foto de la orden.";
    console.error("[captura-orden] procesar foto falló:", detalle, error);
    return fallo(500, "error_proceso", mensajeErrorCaptura(error), { detalle });
  }
}

async function conReintento(trabajo: () => Promise<void>): Promise<void> {
  try {
    await trabajo();
  } catch {
    await new Promise((resolver) => setTimeout(resolver, 400));
    await trabajo().catch((error: unknown) => {
      console.error(
        "[captura-orden] no se pudo guardar el estado del intento:",
        error instanceof Error ? error.message : error,
      );
    });
  }
}

/**
 * Procesa un intento ya reservado y deja su resultado en la tabla. Nunca lanza:
 * corre dentro de `after()` y nadie más puede atender su error.
 */
export async function procesarIntento(
  ref: RefIntento,
  entrada: EntradaFoto,
): Promise<ResultadoFoto> {
  await conReintento(() => marcarProcesando(ref));
  const resultado = await procesarFotoSurtido({
    ...entrada,
    alSubirFoto: async (url) => {
      await guardarUrlFoto(ref, url).catch(() => undefined);
      await entrada.alSubirFoto?.(url);
    },
  });

  if (resultado.ok) {
    await conReintento(() =>
      marcarLista(ref, {
        modelo: resultado.modelo,
        tiempos: resultado.tiempos,
        urlFoto: resultado.urlFoto,
      }),
    );
  } else {
    await conReintento(() =>
      marcarFallo(ref, {
        codigo: resultado.codigo,
        mensaje: resultado.error,
        tiempos: resultado.tiempos,
        urlFoto: resultado.urlFoto,
      }),
    );
  }
  return resultado;
}
