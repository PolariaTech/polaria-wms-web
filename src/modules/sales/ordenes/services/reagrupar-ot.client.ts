import { getApiBaseUrl } from "@/config/env";
import { applyTenantHeaders } from "@/lib/utils/tenant-headers";
import { useAuthStore } from "@/stores/auth.store";
import type {
  EstadoBaseApi,
  PropuestaReagrupacionApi,
} from "../utils/ot/reagrupar-ordenes-trabajo";

/**
 * Cliente del endpoint de POL-390:
 * `POST /ventas/ordenes/:id/ordenes-trabajo/propuesta-reagrupacion`.
 *
 * Solo pide una PROPUESTA: no escribe nada. Sin timeout propio por decisión del
 * producto; quien llama puede cancelar con un `AbortSignal`.
 */

export type CodigoErrorReagrupacion =
  | "SESION"
  | "SIN_PERMISO"
  | "NO_ENCONTRADA"
  | "OV_ESTADO_CAMBIO"
  | "ESTADO_BASE_INVALIDO"
  | "SOLICITUD_INVALIDA"
  | "PROPUESTA_INVALIDA"
  | "PROVEEDOR_IA"
  | "LIMITE_SOLICITUDES"
  | "SERVIDOR"
  | "RED"
  | "RESPUESTA_INESPERADA";

export class ReagrupacionApiError extends Error {
  constructor(
    message: string,
    readonly codigo: CodigoErrorReagrupacion,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ReagrupacionApiError";
  }
}

export type RespuestaReagrupacion =
  | { tipo: "propuesta"; propuesta: PropuestaReagrupacionApi }
  | { tipo: "aclaracion"; mensaje: string }
  | { tipo: "rechazo" };

interface CuerpoRespuesta {
  requestId?: unknown;
  propuestaId?: unknown;
  baseHash?: unknown;
  ots?: unknown;
  resumen?: unknown;
  movimientos?: unknown;
  aclaracion?: unknown;
  rechazo?: unknown;
  error?: unknown;
  message?: unknown;
}

function errorDeRespuesta(
  status: number,
  cuerpo: CuerpoRespuesta,
): ReagrupacionApiError {
  const codigoNegocio = typeof cuerpo.error === "string" ? cuerpo.error : "";

  if (status === 401) {
    return new ReagrupacionApiError(
      "Tu sesión expiró. Vuelve a iniciar sesión.",
      "SESION",
      status,
    );
  }
  if (status === 403) {
    return new ReagrupacionApiError(
      "No tienes permiso para reorganizar órdenes de trabajo.",
      "SIN_PERMISO",
      status,
    );
  }
  if (status === 404) {
    return new ReagrupacionApiError(
      "No se encontró la orden de venta.",
      "NO_ENCONTRADA",
      status,
    );
  }
  if (status === 409 || codigoNegocio === "OV_ESTADO_CAMBIO") {
    return new ReagrupacionApiError(
      "Esta orden ya no está por confirmar.",
      "OV_ESTADO_CAMBIO",
      status,
    );
  }
  if (status === 429) {
    return new ReagrupacionApiError(
      "Hay demasiadas solicitudes en poco tiempo. Espera un momento e inténtalo de nuevo.",
      "LIMITE_SOLICITUDES",
      status,
    );
  }
  if (status === 422 || codigoNegocio === "PROPUESTA_INVALIDA") {
    return new ReagrupacionApiError(
      "La IA no devolvió una propuesta válida. Intenta reformular la instrucción.",
      "PROPUESTA_INVALIDA",
      status,
    );
  }
  if (status === 502 || codigoNegocio === "PROVEEDOR_IA") {
    return new ReagrupacionApiError(
      "No se pudo consultar a la IA. Intenta de nuevo.",
      "PROVEEDOR_IA",
      status,
    );
  }
  if (status === 400) {
    return codigoNegocio === "ESTADO_BASE_INVALIDO"
      ? new ReagrupacionApiError(
          "La estructura de órdenes de trabajo no es válida. Recarga la orden e inténtalo de nuevo.",
          "ESTADO_BASE_INVALIDO",
          status,
        )
      : new ReagrupacionApiError(
          "La solicitud no es válida. Revisa la instrucción e inténtalo de nuevo.",
          "SOLICITUD_INVALIDA",
          status,
        );
  }
  return new ReagrupacionApiError(
    "Error del servidor. Intenta de nuevo más tarde.",
    "SERVIDOR",
    status,
  );
}

function esPropuesta(cuerpo: CuerpoRespuesta): boolean {
  return (
    typeof cuerpo.propuestaId === "string" &&
    typeof cuerpo.baseHash === "string" &&
    Array.isArray(cuerpo.ots) &&
    typeof cuerpo.resumen === "object" &&
    cuerpo.resumen !== null &&
    Array.isArray(cuerpo.movimientos)
  );
}

export async function solicitarPropuestaReagrupacion(params: {
  idOrdenVenta: string;
  requestId: string;
  instruccion: string;
  /** Instrucciones previas rechazadas, en orden. */
  historial: string[];
  estadoBase: EstadoBaseApi;
  signal?: AbortSignal;
}): Promise<RespuestaReagrupacion> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  applyTenantHeaders(headers);

  const url = `${getApiBaseUrl()}/ventas/ordenes/${encodeURIComponent(
    params.idOrdenVenta,
  )}/ordenes-trabajo/propuesta-reagrupacion`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      cache: "no-store",
      signal: params.signal,
      body: JSON.stringify({
        requestId: params.requestId,
        instruccion: params.instruccion,
        historial: params.historial.map((instruccion) => ({ instruccion })),
        estadoBase: params.estadoBase,
      }),
    });
  } catch (error) {
    // La cancelación la maneja quien llama (AbortError); no es un fallo de red.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ReagrupacionApiError(
      "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
      "RED",
    );
  }

  const cuerpo = (await response.json().catch(() => ({}))) as CuerpoRespuesta;

  if (!response.ok) throw errorDeRespuesta(response.status, cuerpo);

  if (cuerpo.requestId !== params.requestId) {
    throw new ReagrupacionApiError(
      "La respuesta no corresponde a la solicitud. Inténtalo de nuevo.",
      "RESPUESTA_INESPERADA",
      response.status,
    );
  }
  if (typeof cuerpo.aclaracion === "string") {
    return { tipo: "aclaracion", mensaje: cuerpo.aclaracion };
  }
  if (cuerpo.rechazo === "FUERA_DE_ALCANCE") return { tipo: "rechazo" };
  if (esPropuesta(cuerpo)) {
    return {
      tipo: "propuesta",
      propuesta: {
        propuestaId: cuerpo.propuestaId as string,
        baseHash: cuerpo.baseHash as string,
        ots: cuerpo.ots as PropuestaReagrupacionApi["ots"],
        resumen: cuerpo.resumen as PropuestaReagrupacionApi["resumen"],
        movimientos: cuerpo.movimientos as PropuestaReagrupacionApi["movimientos"],
      },
    };
  }

  throw new ReagrupacionApiError(
    "La respuesta del servidor no tiene el formato esperado.",
    "RESPUESTA_INESPERADA",
    response.status,
  );
}
