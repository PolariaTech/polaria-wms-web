/** REQ-104: correos de pedidos que registra n8n y su ingreso manual como OV. */

export type ModoCorreos = "todos" | "descartados";

export type EstadoIngresoCorreo = "procesando" | "ingresado" | "error";

/** Estado del ingreso de un correo como OV en el WMS (tabla `correo_pedido_ingreso`). */
export interface IngresoCorreo {
  messageId: string;
  estado: EstadoIngresoCorreo;
  idOrdenVenta: string | null;
  codigoOrdenVenta: string | null;
  error: string | null;
}

export interface CorreoFila {
  recibidoEn: string | null;
  de: string | null;
  para: string | null;
  asunto: string | null;
  messageId: string;
  hilo: string | null;
  adjunto: string | null;
  /** `false` = el flujo lo descartó; `null` = pasó el filtro y lo ingresa el flujo. */
  nuevoPedido: boolean | null;
  motivo: string | null;
  ingreso: IngresoCorreo | null;
}

export interface CorreosLista {
  total: number;
  pagina: number;
  tamano: number;
  filas: CorreoFila[];
}

/** Valores de los campos de filtro tal cual se escriben (fechas como `YYYY-MM-DD`). */
export interface FiltrosCorreos {
  remitente: string;
  asunto: string;
  desde: string;
  hasta: string;
}

export const FILTROS_CORREOS_VACIOS: FiltrosCorreos = {
  remitente: "",
  asunto: "",
  desde: "",
  hasta: "",
};

export const TAMANO_PAGINA_CORREOS = 25;
