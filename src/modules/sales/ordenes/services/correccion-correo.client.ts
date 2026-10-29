import { getApiBaseUrl } from "@/config/env";
import { applyTenantHeaders } from "@/lib/utils/tenant-headers";
import { useAuthStore } from "@/stores/auth.store";
import type { PropuestaCorreccionCorreoApi } from "../utils/ot/aplicar-correccion-correo";

/**
 * Cliente de los endpoints de REQ-187 (`/ventas/ordenes/:id/ordenes-trabajo/…`):
 *
 * - `interpretar-instruccion`: decide qué función corresponde a lo que escribió el
 *   usuario (mover renglones que ya existen o releer el correo y los archivos).
 * - `propuesta-correccion-correo`: releer el correo y los archivos. Tarda de decenas de
 *   segundos a minutos, y el proxy de la web corta a los 30 s, así que NO es una sola
 *   petición: el POST responde 202 con un `jobId` y aquí se consulta el avance.
 *
 * Solo piden PROPUESTAS: nada se escribe. Quien llama cancela con un `AbortSignal`.
 */

export type CodigoErrorCorreccionCorreo =
  | "SESION"
  | "SIN_PERMISO"
  | "NO_ENCONTRADA"
  | "TRABAJO_PERDIDO"
  | "OV_ESTADO_CAMBIO"
  | "SIN_ADJUNTOS_ORIGINALES"
  | "ADJUNTOS_NO_DISPONIBLES"
  | "RELECTURA_NO_CUADRA"
  | "OC_REPETIDA"
  | "SOLICITUD_INVALIDA"
  | "PROVEEDOR_IA"
  | "LIMITE_SOLICITUDES"
  | "SERVIDOR_OCUPADO"
  | "SERVIDOR"
  | "TIEMPO_AGOTADO"
  | "RED"
  | "RESPUESTA_INESPERADA";

export class CorreccionCorreoApiError extends Error {
  constructor(
    message: string,
    readonly codigo: CodigoErrorCorreccionCorreo,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CorreccionCorreoApiError";
  }
}

export type IntencionChatOt = "reorganizar" | "releer_documentos";

export interface ExpectativasUsuarioApi {
  totalOt?: number;
  importeTotal?: number;
}

export interface InterpretacionInstruccionApi {
  intencion: IntencionChatOt;
  /** Frase corta del servidor que explica la decisión; se muestra como texto. */
  motivo: string;
  expectativas: ExpectativasUsuarioApi;
  /** La decidió el respaldo por reglas porque el modelo falló. */
  porReglas: boolean;
}

interface CuerpoRespuesta {
  requestId?: unknown;
  jobId?: unknown;
  estado?: unknown;
  propuesta?: unknown;
  propuestaId?: unknown;
  intencion?: unknown;
  motivo?: unknown;
  expectativas?: unknown;
  porReglas?: unknown;
  error?: unknown;
  message?: unknown;
}

function errorDeRespuesta(
  status: number,
  cuerpo: CuerpoRespuesta,
): CorreccionCorreoApiError {
  const codigoNegocio = typeof cuerpo.error === "string" ? cuerpo.error : "";

  if (status === 401) {
    return new CorreccionCorreoApiError(
      "Tu sesión expiró. Vuelve a iniciar sesión.",
      "SESION",
      status,
    );
  }
  if (status === 403) {
    return new CorreccionCorreoApiError(
      "No tienes permiso para corregir órdenes de trabajo.",
      "SIN_PERMISO",
      status,
    );
  }
  if (status === 404 && codigoNegocio === "TRABAJO_NO_ENCONTRADO") {
    return new CorreccionCorreoApiError(
      "La corrección se perdió (el servidor se reinició o pasó mucho tiempo). Vuelve a intentarlo.",
      "TRABAJO_PERDIDO",
      status,
    );
  }
  if (status === 404) {
    return new CorreccionCorreoApiError(
      "No se encontró la orden de venta.",
      "NO_ENCONTRADA",
      status,
    );
  }
  if (status === 429) {
    return new CorreccionCorreoApiError(
      "Hay demasiadas solicitudes en poco tiempo. Espera un momento e inténtalo de nuevo.",
      "LIMITE_SOLICITUDES",
      status,
    );
  }
  if (codigoNegocio === "OV_ESTADO_CAMBIO") {
    return new CorreccionCorreoApiError(
      "Esta orden ya no está por confirmar.",
      "OV_ESTADO_CAMBIO",
      status,
    );
  }
  if (codigoNegocio === "OC_REPETIDA") {
    return new CorreccionCorreoApiError(
      "Dos archivos de la orden traen la misma orden de compra. Revísalos antes de corregir.",
      "OC_REPETIDA",
      status,
    );
  }
  if (codigoNegocio === "SIN_ADJUNTOS_ORIGINALES") {
    return new CorreccionCorreoApiError(
      "Esta orden no conserva los archivos originales del correo, así que no se puede releer.",
      "SIN_ADJUNTOS_ORIGINALES",
      status,
    );
  }
  if (codigoNegocio === "ADJUNTOS_NO_DISPONIBLES") {
    return new CorreccionCorreoApiError(
      "No se pudieron leer los archivos originales de la orden.",
      "ADJUNTOS_NO_DISPONIBLES",
      status,
    );
  }
  if (codigoNegocio === "RELECTURA_NO_CUADRA") {
    return new CorreccionCorreoApiError(
      "La relectura no coincide con el total de los documentos, así que no se propone ningún cambio. Inténtalo de nuevo o corrige a mano.",
      "RELECTURA_NO_CUADRA",
      status,
    );
  }
  if (status === 503 || codigoNegocio === "DEMASIADOS_TRABAJOS") {
    return new CorreccionCorreoApiError(
      "El servidor está ocupado con otras correcciones. Intenta en un momento.",
      "SERVIDOR_OCUPADO",
      status,
    );
  }
  if (status === 502 || codigoNegocio === "PROVEEDOR_IA") {
    return new CorreccionCorreoApiError(
      "No se pudo consultar a la IA. Intenta de nuevo.",
      "PROVEEDOR_IA",
      status,
    );
  }
  if (status === 400) {
    return new CorreccionCorreoApiError(
      "La solicitud no es válida. Revisa la instrucción e inténtalo de nuevo.",
      "SOLICITUD_INVALIDA",
      status,
    );
  }
  return new CorreccionCorreoApiError(
    "Error del servidor. Intenta de nuevo más tarde.",
    "SERVIDOR",
    status,
  );
}

function cabeceras(): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  applyTenantHeaders(headers);
  return headers;
}

function urlOt(idOrdenVenta: string, ruta: string): string {
  return `${getApiBaseUrl()}/ventas/ordenes/${encodeURIComponent(
    idOrdenVenta,
  )}/ordenes-trabajo/${ruta}`;
}

/** fetch + JSON con los errores de red y de HTTP ya traducidos; relanza la cancelación. */
async function pedirJson(
  url: string,
  init: RequestInit,
): Promise<{ status: number; cuerpo: CuerpoRespuesta }> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store" });
  } catch (error) {
    // La cancelación la maneja quien llama (AbortError); no es un fallo de red.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new CorreccionCorreoApiError(
      "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
      "RED",
    );
  }
  const cuerpo = (await response.json().catch(() => ({}))) as CuerpoRespuesta;
  if (!response.ok) throw errorDeRespuesta(response.status, cuerpo);
  return { status: response.status, cuerpo };
}

function esNumeroPositivo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0;
}

/**
 * Decide qué función ejecutar con lo que escribió el usuario. Tarda unos segundos.
 */
export async function interpretarInstruccion(params: {
  idOrdenVenta: string;
  requestId: string;
  instruccion: string;
  signal?: AbortSignal;
}): Promise<InterpretacionInstruccionApi> {
  const { cuerpo, status } = await pedirJson(
    urlOt(params.idOrdenVenta, "interpretar-instruccion"),
    {
      method: "POST",
      headers: cabeceras(),
      signal: params.signal,
      body: JSON.stringify({
        requestId: params.requestId,
        instruccion: params.instruccion.trim(),
      }),
    },
  );

  const intencion = cuerpo.intencion;
  if (
    cuerpo.requestId !== params.requestId ||
    (intencion !== "reorganizar" && intencion !== "releer_documentos")
  ) {
    throw new CorreccionCorreoApiError(
      "La respuesta del servidor no corresponde a la solicitud. Inténtalo de nuevo.",
      "RESPUESTA_INESPERADA",
      status,
    );
  }

  const bruto =
    typeof cuerpo.expectativas === "object" && cuerpo.expectativas !== null
      ? (cuerpo.expectativas as Record<string, unknown>)
      : {};
  return {
    intencion,
    motivo: typeof cuerpo.motivo === "string" ? cuerpo.motivo : "",
    expectativas: {
      ...(esNumeroPositivo(bruto.totalOt) ? { totalOt: bruto.totalOt } : {}),
      ...(esNumeroPositivo(bruto.importeTotal)
        ? { importeTotal: bruto.importeTotal }
        : {}),
    },
    porReglas: cuerpo.porReglas === true,
  };
}

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

function esperarMs(ms: number, signal?: AbortSignal): Promise<void> {
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

  const { cuerpo: inicio, status } = await pedirJson(
    urlOt(params.idOrdenVenta, "propuesta-correccion-correo"),
    {
      method: "POST",
      headers: cabeceras(),
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
  const esperar = params.esperar ?? esperarMs;
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

    let respuesta: { status: number; cuerpo: CuerpoRespuesta };
    try {
      respuesta = await pedirJson(
        `${urlOt(params.idOrdenVenta, "propuesta-correccion-correo")}/${encodeURIComponent(jobId)}`,
        { method: "GET", headers: cabeceras(), signal: params.signal },
      );
      fallosRed = 0;
    } catch (error) {
      // Un corte de red momentáneo no debe tirar una relectura de minutos.
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
