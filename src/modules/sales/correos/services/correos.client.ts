import { getApiBaseUrl } from "@/config/env";
import { applyTenantHeaders } from "@/lib/utils/tenant-headers";
import { useAuthStore } from "@/stores/auth.store";
import type {
  AdjuntoCorreo,
  CorreoContenido,
  CorreoFila,
  CorreosLista,
  EstadoIngresoCorreo,
  EstadoIngresoFiltro,
  FiltrosCorreos,
  IngresoCorreo,
  ModoCorreos,
} from "../types/correos.types";
import { finDelDiaColombia, inicioDelDiaColombia } from "../utils/correos-formato";
import {
  CorreosApiError,
  errorDeRespuesta,
  inesperada,
} from "./correos.client.errores";
import { leerCamposDelFlujo } from "./correos.lectura";

export type { CodigoErrorCorreos } from "./correos.client.errores";
export { CorreosApiError, inesperada } from "./correos.client.errores";

/**
 * Cliente de REQ-104:
 *  - `GET  /ventas/correos`                          lista los correos que registra n8n.
 *  - `GET  /ventas/correos/:messageId`                una fila de la lista (REQ-318).
 *  - `POST /ventas/correos/:messageId/ingresar`      crea la OV en segundo plano (202).
 *  - `GET  /ventas/correos/:messageId/ingreso`       avance del ingreso (se sondea).
 *  - `GET  /ventas/correos/:messageId/contenido`     el correo completo, para mostrarlo.
 *  - `GET  /ventas/correos/:messageId/adjuntos/:n`   un adjunto, para descargarlo.
 */

const ESTADOS: readonly EstadoIngresoCorreo[] = [
  "procesando",
  "ingresado",
  "error",
];

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === "object" && valor !== null && !Array.isArray(valor);

const textoONulo = (valor: unknown): string | null =>
  typeof valor === "string" ? valor : null;

async function enviar(
  ruta: string,
  opciones: { method: "GET" | "POST"; signal?: AbortSignal },
): Promise<Response> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  applyTenantHeaders(headers);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${getApiBaseUrl()}${ruta}`, {
      method: opciones.method,
      headers,
      cache: "no-store",
      signal: opciones.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new CorreosApiError(
      "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
      "RED",
    );
  }

  if (!respuesta.ok) {
    const cuerpo: unknown = await respuesta.json().catch(() => ({}));
    throw errorDeRespuesta(respuesta.status, esObjeto(cuerpo) ? cuerpo : {});
  }
  return respuesta;
}

export async function pedir(
  ruta: string,
  opciones: { method: "GET" | "POST"; signal?: AbortSignal },
): Promise<unknown> {
  const respuesta = await enviar(ruta, opciones);
  return respuesta.json().catch(() => ({}));
}

export function leerIngreso(valor: unknown): IngresoCorreo | null {
  if (!esObjeto(valor)) return null;
  const { messageId, estado } = valor;
  if (typeof messageId !== "string") return null;
  if (!ESTADOS.includes(estado as EstadoIngresoCorreo)) return null;
  return {
    messageId,
    estado: estado as EstadoIngresoCorreo,
    idOrdenVenta: textoONulo(valor.idOrdenVenta),
    codigoOrdenVenta: textoONulo(valor.codigoOrdenVenta),
    error: textoONulo(valor.error),
  };
}

export function leerFila(valor: unknown): CorreoFila | null {
  if (!esObjeto(valor) || typeof valor.messageId !== "string") return null;
  return {
    messageId: valor.messageId,
    recibidoEn: textoONulo(valor.recibidoEn),
    de: textoONulo(valor.de),
    para: textoONulo(valor.para),
    asunto: textoONulo(valor.asunto),
    hilo: textoONulo(valor.hilo),
    adjunto: textoONulo(valor.adjunto),
    ...leerCamposDelFlujo(valor),
    ingreso: leerIngreso(valor.ingreso),
  };
}

function leerAdjunto(valor: unknown): AdjuntoCorreo | null {
  if (!esObjeto(valor)) return null;
  const { indice, nombre, mimeType, tamano } = valor;
  if (typeof indice !== "number" || typeof nombre !== "string") return null;
  return {
    indice,
    nombre,
    mimeType: typeof mimeType === "string" ? mimeType : "application/octet-stream",
    tamano: typeof tamano === "number" ? tamano : 0,
  };
}

export async function listarCorreos(
  parametros: {
    modo: ModoCorreos;
    pagina: number;
    tamano: number;
    filtros: FiltrosCorreos;
    /** REQ-387: p. ej. `reintentar` para el modal de pendientes. */
    estadoIngreso?: EstadoIngresoFiltro;
  },
  signal?: AbortSignal,
): Promise<CorreosLista> {
  const consulta = new URLSearchParams({
    modo: parametros.modo,
    pagina: String(parametros.pagina),
    tamano: String(parametros.tamano),
  });
  if (parametros.estadoIngreso) {
    consulta.set("estadoIngreso", parametros.estadoIngreso);
  }
  const { remitente, asunto, desde, hasta } = parametros.filtros;
  if (remitente.trim()) consulta.set("remitente", remitente.trim());
  if (asunto.trim()) consulta.set("asunto", asunto.trim());
  if (desde) consulta.set("desde", inicioDelDiaColombia(desde));
  if (hasta) consulta.set("hasta", finDelDiaColombia(hasta));

  const cuerpo = await pedir(`/ventas/correos?${consulta.toString()}`, {
    method: "GET",
    signal,
  });
  if (!esObjeto(cuerpo) || !Array.isArray(cuerpo.filas)) throw inesperada();

  const filas = cuerpo.filas
    .map(leerFila)
    .filter((fila): fila is CorreoFila => fila !== null);
  return {
    total: typeof cuerpo.total === "number" ? cuerpo.total : filas.length,
    pagina: typeof cuerpo.pagina === "number" ? cuerpo.pagina : parametros.pagina,
    tamano: typeof cuerpo.tamano === "number" ? cuerpo.tamano : parametros.tamano,
    filas,
  };
}

export async function ingresarCorreo(
  messageId: string,
  signal?: AbortSignal,
): Promise<IngresoCorreo> {
  const cuerpo = await pedir(
    `/ventas/correos/${encodeURIComponent(messageId)}/ingresar`,
    { method: "POST", signal },
  );
  const ingreso = leerIngreso(cuerpo);
  if (!ingreso) throw inesperada();
  return ingreso;
}

export async function consultarIngreso(
  messageId: string,
  signal?: AbortSignal,
): Promise<IngresoCorreo> {
  const cuerpo = await pedir(
    `/ventas/correos/${encodeURIComponent(messageId)}/ingreso`,
    { method: "GET", signal },
  );
  const ingreso = leerIngreso(cuerpo);
  if (!ingreso) throw inesperada();
  return ingreso;
}

/** El correo completo (cuerpo y datos de adjuntos). Lo lee el api en Gmail: puede tardar. */
export async function obtenerCorreoCompleto(
  messageId: string,
  signal?: AbortSignal,
): Promise<CorreoContenido> {
  const cuerpo = await pedir(
    `/ventas/correos/${encodeURIComponent(messageId)}/contenido`,
    { method: "GET", signal },
  );
  if (!esObjeto(cuerpo)) throw inesperada();
  return {
    asunto: textoONulo(cuerpo.asunto) ?? "",
    de: textoONulo(cuerpo.de) ?? "",
    para: textoONulo(cuerpo.para) ?? "",
    fecha: textoONulo(cuerpo.fecha),
    texto: textoONulo(cuerpo.texto) ?? "",
    html: textoONulo(cuerpo.html) ?? "",
    adjuntos: (Array.isArray(cuerpo.adjuntos) ? cuerpo.adjuntos : [])
      .map(leerAdjunto)
      .filter((adjunto): adjunto is AdjuntoCorreo => adjunto !== null),
  };
}

/** Los bytes de un adjunto. Va con la sesión, por eso no es un simple enlace de descarga. */
export async function descargarAdjunto(
  messageId: string,
  indice: number,
  signal?: AbortSignal,
): Promise<Blob> {
  const respuesta = await enviar(
    `/ventas/correos/${encodeURIComponent(messageId)}/adjuntos/${indice}`,
    { method: "GET", signal },
  );
  return respuesta.blob();
}
