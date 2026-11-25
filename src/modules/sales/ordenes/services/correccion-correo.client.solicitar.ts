import type { PropuestaCorreccionCorreoApi } from "../utils/ot/aplicar-correccion-correo";
import {
  CorreccionCorreoApiError,
  type CuerpoRespuestaCorreccionCorreo,
  type ExpectativasUsuarioApi,
} from "./correccion-correo.client.types";
import {
  cabecerasCorreccionCorreo,
  pedirJsonCorreccionCorreo,
  urlOtCorreccionCorreo,
} from "./correccion-correo.client.http";

function esPropuesta(valor: unknown): valor is PropuestaCorreccionCorreoApi {
  if (typeof valor !== "object" || valor === null) return false;
  const propuestaBruta = valor as Record<string, unknown>;
  return (
    typeof propuestaBruta.propuestaId === "string" &&
    typeof propuestaBruta.baseHash === "string" &&
    Array.isArray(propuestaBruta.documentos) &&
    Array.isArray(propuestaBruta.ots) &&
    typeof propuestaBruta.resumen === "object" &&
    propuestaBruta.resumen !== null &&
    typeof propuestaBruta.diff === "object" &&
    propuestaBruta.diff !== null &&
    Array.isArray(propuestaBruta.advertencias)
  );
}

export function esperarMsCorreccionCorreo(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolver, rechazar) => {
    if (signal?.aborted) {
      rechazar(new DOMException("cancelado", "AbortError"));
      return;
    }
    const temporizador = setTimeout(() => {
      signal?.removeEventListener("abort", alCancelar);
      resolver();
    }, ms);
    const alCancelar = () => {
      clearTimeout(temporizador);
      rechazar(new DOMException("cancelado", "AbortError"));
    };
    signal?.addEventListener("abort", alCancelar, { once: true });
  });
}

/** Cada cuántos ms se consulta el avance y cuánto se espera en total. */
export const INTERVALO_CONSULTA_MS = 3000;
export const ESPERA_MAXIMA_MS = 6 * 60 * 1000;
/** Fallos de red seguidos que se toleran mientras se consulta el avance. */
const MAX_FALLOS_RED_SEGUIDOS = 3;

/**
 * Relee el correo y los archivos de la OV y devuelve la propuesta: inicia el trabajo
 * (202) y consulta su avance hasta que termina, falla o se agota la espera.
 */
export async function solicitarCorreccionCorreo(params: {
  idOrdenVenta: string;
  requestId: string;
  /** Nota del usuario; el servidor la registra, no condiciona la lectura. */
  instruccion?: string;
  /** Lo que el usuario dijo esperar; el servidor lo compara con los documentos. */
  expectativas?: ExpectativasUsuarioApi;
  signal?: AbortSignal;
  /** Inyectables para pruebas. */
  intervaloMs?: number;
  esperaMaximaMs?: number;
  esperar?: (ms: number, signal?: AbortSignal) => Promise<void>;
}): Promise<PropuestaCorreccionCorreoApi> {
  const instruccion = params.instruccion?.trim();
  const expectativas = params.expectativas;
  const hayExpectativas =
    expectativas !== undefined &&
    (expectativas.totalOt !== undefined ||
      expectativas.importeTotal !== undefined);

  const { cuerpo: inicio, status } = await pedirJsonCorreccionCorreo(
    urlOtCorreccionCorreo(params.idOrdenVenta, "propuesta-correccion-correo"),
    {
      method: "POST",
      headers: cabecerasCorreccionCorreo(),
      signal: params.signal,
      body: JSON.stringify({
        requestId: params.requestId,
        ...(instruccion ? { instruccion } : {}),
        ...(hayExpectativas ? { expectativas } : {}),
      }),
    },
  );

  if (
    inicio.requestId === undefined ||
    typeof inicio.jobId !== "string" ||
    inicio.estado !== "procesando"
  ) {
    throw new CorreccionCorreoApiError(
      "La respuesta del servidor no tiene el formato esperado.",
      "RESPUESTA_INESPERADA",
      status,
    );
  }
  const jobId = inicio.jobId;
  const intervalo = params.intervaloMs ?? INTERVALO_CONSULTA_MS;
  const esperar = params.esperar ?? esperarMsCorreccionCorreo;
  const limite = Date.now() + (params.esperaMaximaMs ?? ESPERA_MAXIMA_MS);
  let fallosRed = 0;

  for (;;) {
    await esperar(intervalo, params.signal);
    if (Date.now() > limite) {
      throw new CorreccionCorreoApiError(
        "La corrección está tardando demasiado. Vuelve a intentarlo en un momento.",
        "TIEMPO_AGOTADO",
      );
    }

    let respuesta: { status: number; cuerpo: CuerpoRespuestaCorreccionCorreo };
    try {
      respuesta = await pedirJsonCorreccionCorreo(
        `${urlOtCorreccionCorreo(params.idOrdenVenta, "propuesta-correccion-correo")}/${encodeURIComponent(jobId)}`,
        { method: "GET", headers: cabecerasCorreccionCorreo(), signal: params.signal },
      );
      fallosRed = 0;
    } catch (error) {
      if (
        error instanceof CorreccionCorreoApiError &&
        error.codigo === "RED" &&
        (fallosRed += 1) <= MAX_FALLOS_RED_SEGUIDOS
      ) {
        continue;
      }
      throw error;
    }

    const { cuerpo, status: estadoHttp } = respuesta;
    if (cuerpo.estado === "procesando") continue;
    if (cuerpo.estado === "listo" && esPropuesta(cuerpo.propuesta)) {
      if (cuerpo.propuesta.requestId !== params.requestId) {
        throw new CorreccionCorreoApiError(
          "La respuesta del servidor no corresponde a la solicitud. Inténtalo de nuevo.",
          "RESPUESTA_INESPERADA",
          estadoHttp,
        );
      }
      return cuerpo.propuesta;
    }
    throw new CorreccionCorreoApiError(
      "La respuesta del servidor no tiene el formato esperado.",
      "RESPUESTA_INESPERADA",
      estadoHttp,
    );
  }
}