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

export interface CuerpoRespuestaCorreccionCorreo {
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