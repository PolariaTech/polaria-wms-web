import {
  consultarIngreso,
  CorreosApiError,
  ingresarCorreo,
} from "../services/correos.client";
import type { IngresoCorreo } from "../types/correos.types";

const SONDEO_MS = 3_000;
/** Tope del lote: no bloquear el modal esperando al worker (Gmail/IA). */
const MAX_ESPERA_MS = 90_000;
const PAUSA_ENTRE_LOTES_MS = 800;

const ERRORES_QUE_CORTAN: ReadonlySet<string> = new Set([
  "SESION",
  "SIN_PERMISO",
  "CUENTA_NO_HABILITADA",
]);

export const ERROR_INGRESO_LENTO =
  "El ingreso tarda demasiado. Déjalo y reintenta en unos minutos.";

function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolver, rechazar) => {
    if (signal?.aborted) {
      rechazar(new DOMException("Aborted", "AbortError"));
      return;
    }
    const temporizador = setTimeout(resolver, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(temporizador);
        rechazar(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function comoError(messageId: string, error: string): IngresoCorreo {
  return {
    messageId,
    estado: "error",
    idOrdenVenta: null,
    codigoOrdenVenta: null,
    error,
  };
}

async function consultarSinCortar(
  messageId: string,
  signal: AbortSignal,
): Promise<IngresoCorreo | null> {
  try {
    return await consultarIngreso(messageId, signal);
  } catch (causa) {
    if (signal.aborted) throw causa;
    if (causa instanceof CorreosApiError && ERRORES_QUE_CORTAN.has(causa.codigo)) {
      throw causa;
    }
    return null;
  }
}

async function sondearHastaFinal(
  messageId: string,
  signal: AbortSignal,
): Promise<IngresoCorreo> {
  const inicial = await ingresarCorreo(messageId, signal);
  if (inicial.estado !== "procesando") return inicial;

  while (!signal.aborted) {
    await esperar(SONDEO_MS, signal);
    const actual = await consultarSinCortar(messageId, signal);
    if (actual && actual.estado !== "procesando") return actual;
  }
  throw new DOMException("Aborted", "AbortError");
}

/**
 * Lanza el ingreso y espera el estado final (`ingresado` | `error`).
 * REQ-387: no dar por bueno el 202; cortar a los ~90 s para no trabar el lote.
 */
export async function esperarResultadoIngreso(
  messageId: string,
  signal?: AbortSignal,
): Promise<IngresoCorreo> {
  const control = new AbortController();
  const reenviarAbort = () => control.abort();
  signal?.addEventListener("abort", reenviarAbort, { once: true });

  const trabajo = sondearHastaFinal(messageId, control.signal);
  const tope = esperar(MAX_ESPERA_MS, control.signal).then(() =>
    comoError(messageId, ERROR_INGRESO_LENTO),
  );

  try {
    const resultado = await Promise.race([trabajo, tope]);
    control.abort();
    await Promise.allSettled([trabajo, tope]);
    return resultado;
  } catch (causa) {
    control.abort();
    await Promise.allSettled([trabajo, tope]);
    if (signal?.aborted) throw causa;
    if (causa instanceof DOMException && causa.name === "AbortError") {
      return comoError(messageId, ERROR_INGRESO_LENTO);
    }
    throw causa;
  } finally {
    signal?.removeEventListener("abort", reenviarAbort);
  }
}

/** Pausa corta entre correos del lote para no saturar Gmail (429). */
export function pausaEntreReintentos(signal?: AbortSignal): Promise<void> {
  return esperar(PAUSA_ENTRE_LOTES_MS, signal);
}
