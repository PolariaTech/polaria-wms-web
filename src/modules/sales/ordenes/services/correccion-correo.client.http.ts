import { getApiBaseUrl } from "@/config/env";
import { applyTenantHeaders } from "@/lib/utils/tenant-headers";
import { useAuthStore } from "@/stores/auth.store";
import {
  CorreccionCorreoApiError,
  type CuerpoRespuestaCorreccionCorreo,
} from "./correccion-correo.client.types";

export function errorDeRespuesta(
  status: number,
  cuerpo: CuerpoRespuestaCorreccionCorreo,
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
      "La relectura no coincide con el total de los documentos. Si el servidor aún bloquea la propuesta, actualiza la API o corrige a mano.",
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

export function cabecerasCorreccionCorreo(): Headers {
  const headers = new Headers({ "Content-Type": "application/json" });
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  applyTenantHeaders(headers);
  return headers;
}

export function urlOtCorreccionCorreo(idOrdenVenta: string, ruta: string): string {
  return `${getApiBaseUrl()}/ventas/ordenes/${encodeURIComponent(
    idOrdenVenta,
  )}/ordenes-trabajo/${ruta}`;
}

/** fetch + JSON con los errores de red y de HTTP ya traducidos; relanza la cancelación. */
export async function pedirJsonCorreccionCorreo(
  url: string,
  init: RequestInit,
): Promise<{ status: number; cuerpo: CuerpoRespuestaCorreccionCorreo }> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, cache: "no-store" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new CorreccionCorreoApiError(
      "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
      "RED",
    );
  }
  const cuerpo = (await response.json().catch(() => ({}))) as CuerpoRespuestaCorreccionCorreo;
  if (!response.ok) throw errorDeRespuesta(response.status, cuerpo);
  return { status: response.status, cuerpo };
}

export function esNumeroPositivo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0;
}