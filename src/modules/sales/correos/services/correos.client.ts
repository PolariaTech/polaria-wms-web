import { getApiBaseUrl } from "@/config/env";
import { applyTenantHeaders } from "@/lib/utils/tenant-headers";
import { useAuthStore } from "@/stores/auth.store";
import type {
  CorreoFila,
  CorreosLista,
  EstadoIngresoCorreo,
  FiltrosCorreos,
  IngresoCorreo,
  ModoCorreos,
} from "../types/correos.types";

/**
 * Cliente de REQ-104:
 *  - `GET  /ventas/correos`                        lista los correos que registra n8n.
 *  - `POST /ventas/correos/:messageId/ingresar`    reserva el correo y crea la OV en segundo plano (202).
 *  - `GET  /ventas/correos/:messageId/ingreso`     avance del ingreso (se sondea).
 */

export type CodigoErrorCorreos =
  | "SESION"
  | "SIN_PERMISO"
  | "CUENTA_NO_HABILITADA"
  | "YA_INGRESADO"
  | "NO_ENCONTRADO"
  | "LIMITE_SOLICITUDES"
  | "N8N"
  | "SERVIDOR"
  | "RED"
  | "RESPUESTA_INESPERADA";

export class CorreosApiError extends Error {
  constructor(
    message: string,
    readonly codigo: CodigoErrorCorreos,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CorreosApiError";
  }
}

interface CuerpoError {
  message?: unknown;
  error?: unknown;
}

const ESTADOS: readonly EstadoIngresoCorreo[] = [
  "procesando",
  "ingresado",
  "error",
];

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const textoONulo = (v: unknown): string | null =>
  typeof v === "string" ? v : null;

function errorDeRespuesta(status: number, cuerpo: CuerpoError): CorreosApiError {
  const codigoNegocio = typeof cuerpo.error === "string" ? cuerpo.error : "";
  const mensaje = typeof cuerpo.message === "string" ? cuerpo.message : "";

  if (status === 401) {
    return new CorreosApiError(
      "Tu sesión expiró. Vuelve a iniciar sesión.",
      "SESION",
      status,
    );
  }
  if (status === 403 && codigoNegocio === "CORREOS_NO_DISPONIBLES") {
    return new CorreosApiError(
      "Los correos de pedidos no están habilitados para esta cuenta.",
      "CUENTA_NO_HABILITADA",
      status,
    );
  }
  if (status === 403) {
    return new CorreosApiError(
      "No tienes permiso para ver los correos de pedidos.",
      "SIN_PERMISO",
      status,
    );
  }
  if (status === 404) {
    return new CorreosApiError(
      "Este correo todavía no se ha intentado ingresar.",
      "NO_ENCONTRADO",
      status,
    );
  }
  if (status === 409 && codigoNegocio === "CORREO_YA_INGRESADO") {
    return new CorreosApiError(
      mensaje || "Este pedido ya fue ingresado.",
      "YA_INGRESADO",
      status,
    );
  }
  if (status === 429) {
    return new CorreosApiError(
      "Hay demasiadas solicitudes en poco tiempo. Espera un momento e inténtalo de nuevo.",
      "LIMITE_SOLICITUDES",
      status,
    );
  }
  if (status === 502 || codigoNegocio.startsWith("N8N_")) {
    return new CorreosApiError(
      "No se pudo consultar los correos en este momento. Intenta de nuevo en un minuto.",
      "N8N",
      status,
    );
  }
  if (status === 503 && codigoNegocio === "CORREOS_NO_CONFIGURADOS") {
    return new CorreosApiError(
      "Los correos de pedidos todavía no están configurados en este entorno.",
      "N8N",
      status,
    );
  }
  return new CorreosApiError(
    "Error del servidor. Intenta de nuevo más tarde.",
    "SERVIDOR",
    status,
  );
}

async function pedir(
  ruta: string,
  init: { method: "GET" | "POST"; signal?: AbortSignal },
): Promise<unknown> {
  const headers = new Headers({ "Content-Type": "application/json" });
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  applyTenantHeaders(headers);

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${ruta}`, {
      method: init.method,
      headers,
      cache: "no-store",
      signal: init.signal,
    });
  } catch (error) {
    // La cancelación la maneja quien llama (AbortError); no es un fallo de red.
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new CorreosApiError(
      "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
      "RED",
    );
  }

  const cuerpo: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw errorDeRespuesta(
      response.status,
      esObjeto(cuerpo) ? (cuerpo as CuerpoError) : {},
    );
  }
  return cuerpo;
}

function inesperada(): CorreosApiError {
  return new CorreosApiError(
    "La respuesta del servidor no tiene el formato esperado.",
    "RESPUESTA_INESPERADA",
  );
}

export function leerIngreso(v: unknown): IngresoCorreo | null {
  if (!esObjeto(v)) return null;
  const { messageId, estado } = v;
  if (typeof messageId !== "string") return null;
  if (!ESTADOS.includes(estado as EstadoIngresoCorreo)) return null;
  return {
    messageId,
    estado: estado as EstadoIngresoCorreo,
    idOrdenVenta: textoONulo(v.idOrdenVenta),
    codigoOrdenVenta: textoONulo(v.codigoOrdenVenta),
    error: textoONulo(v.error),
  };
}

function leerFila(v: unknown): CorreoFila | null {
  if (!esObjeto(v) || typeof v.messageId !== "string") return null;
  return {
    messageId: v.messageId,
    recibidoEn: textoONulo(v.recibidoEn),
    de: textoONulo(v.de),
    para: textoONulo(v.para),
    asunto: textoONulo(v.asunto),
    hilo: textoONulo(v.hilo),
    adjunto: textoONulo(v.adjunto),
    nuevoPedido: typeof v.nuevoPedido === "boolean" ? v.nuevoPedido : null,
    motivo: textoONulo(v.motivo),
    idRegistro: textoONulo(v.idRegistro),
    registradoEn: textoONulo(v.registradoEn),
    actualizadoEn: textoONulo(v.actualizadoEn),
    ingreso: leerIngreso(v.ingreso),
  };
}

/** `YYYY-MM-DD` del campo de fecha → instante en hora de Colombia (UTC-5). */
export function inicioDelDiaColombia(dia: string): string {
  return `${dia}T00:00:00.000-05:00`;
}

export function finDelDiaColombia(dia: string): string {
  return `${dia}T23:59:59.999-05:00`;
}

export async function listarCorreos(
  params: {
    modo: ModoCorreos;
    pagina: number;
    tamano: number;
    filtros: FiltrosCorreos;
  },
  signal?: AbortSignal,
): Promise<CorreosLista> {
  const query = new URLSearchParams({
    modo: params.modo,
    pagina: String(params.pagina),
    tamano: String(params.tamano),
  });
  const { remitente, asunto, desde, hasta } = params.filtros;
  if (remitente.trim()) query.set("remitente", remitente.trim());
  if (asunto.trim()) query.set("asunto", asunto.trim());
  if (desde) query.set("desde", inicioDelDiaColombia(desde));
  if (hasta) query.set("hasta", finDelDiaColombia(hasta));

  const cuerpo = await pedir(`/ventas/correos?${query.toString()}`, {
    method: "GET",
    signal,
  });
  if (!esObjeto(cuerpo) || !Array.isArray(cuerpo.filas)) throw inesperada();

  const filas = cuerpo.filas
    .map(leerFila)
    .filter((fila): fila is CorreoFila => fila !== null);
  return {
    total: typeof cuerpo.total === "number" ? cuerpo.total : filas.length,
    pagina: typeof cuerpo.pagina === "number" ? cuerpo.pagina : params.pagina,
    tamano: typeof cuerpo.tamano === "number" ? cuerpo.tamano : params.tamano,
    filas,
  };
}

export async function ingresarCorreo(messageId: string): Promise<IngresoCorreo> {
  const cuerpo = await pedir(
    `/ventas/correos/${encodeURIComponent(messageId)}/ingresar`,
    { method: "POST" },
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
