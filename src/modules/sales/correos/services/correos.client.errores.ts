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

interface ReglaError {
  cuando: (estado: number, errorApi: string) => boolean;
  codigo: CodigoErrorCorreos;
  mensaje: string | ((mensajeApi: string) => string);
}

/** La primera regla que coincide manda; el orden va de lo específico a lo general. */
const REGLAS_ERROR: readonly ReglaError[] = [
  {
    cuando: (estado) => estado === 401,
    codigo: "SESION",
    mensaje: "Tu sesión expiró. Vuelve a iniciar sesión.",
  },
  {
    cuando: (estado, errorApi) =>
      estado === 403 && errorApi === "CORREOS_NO_DISPONIBLES",
    codigo: "CUENTA_NO_HABILITADA",
    mensaje: "Los correos de pedidos no están habilitados para esta cuenta.",
  },
  {
    cuando: (estado) => estado === 403,
    codigo: "SIN_PERMISO",
    mensaje: "No tienes permiso para ver los correos de pedidos.",
  },
  {
    cuando: (estado, errorApi) =>
      estado === 404 && errorApi === "ADJUNTO_NO_ENCONTRADO",
    codigo: "NO_ENCONTRADO",
    mensaje: "El correo no tiene ese adjunto.",
  },
  {
    cuando: (estado) => estado === 404,
    codigo: "NO_ENCONTRADO",
    mensaje: "Este correo todavía no se ha intentado ingresar.",
  },
  {
    cuando: (estado, errorApi) =>
      estado === 409 && errorApi === "CORREO_YA_INGRESADO",
    codigo: "YA_INGRESADO",
    mensaje: (mensajeApi) => mensajeApi || "Este pedido ya fue ingresado.",
  },
  {
    cuando: (estado) => estado === 429,
    codigo: "LIMITE_SOLICITUDES",
    mensaje:
      "Hay demasiadas solicitudes en poco tiempo. Espera un momento e inténtalo de nuevo.",
  },
  {
    cuando: (estado, errorApi) =>
      estado === 502 || errorApi.startsWith("N8N_"),
    codigo: "N8N",
    mensaje:
      "No se pudo consultar los correos en este momento. Intenta de nuevo en un minuto.",
  },
  {
    cuando: (estado, errorApi) =>
      estado === 503 && errorApi === "CORREOS_NO_CONFIGURADOS",
    codigo: "N8N",
    mensaje: "Los correos de pedidos todavía no están configurados en este entorno.",
  },
];

export function errorDeRespuesta(
  estado: number,
  cuerpo: CuerpoError,
): CorreosApiError {
  const errorApi = typeof cuerpo.error === "string" ? cuerpo.error : "";
  const mensajeApi = typeof cuerpo.message === "string" ? cuerpo.message : "";
  const regla = REGLAS_ERROR.find((candidata) =>
    candidata.cuando(estado, errorApi),
  );
  if (!regla) {
    return new CorreosApiError(
      "Error del servidor. Intenta de nuevo más tarde.",
      "SERVIDOR",
      estado,
    );
  }
  const mensaje =
    typeof regla.mensaje === "function" ? regla.mensaje(mensajeApi) : regla.mensaje;
  return new CorreosApiError(mensaje, regla.codigo, estado);
}

export function inesperada(): CorreosApiError {
  return new CorreosApiError(
    "La respuesta del servidor no tiene el formato esperado.",
    "RESPUESTA_INESPERADA",
  );
}
