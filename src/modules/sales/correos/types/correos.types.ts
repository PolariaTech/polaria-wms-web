import { DEFAULT_TABLE_PAGE_SIZE } from "@/constants/ui/table-pagination";

/** REQ-104: correos de pedidos que registra n8n y su ingreso manual como OV. */

export type ModoCorreos = "todos" | "descartados";

export type EstadoIngresoCorreo = "procesando" | "ingresado" | "error";

/** Qué hizo el flujo de n8n con el correo (columna `resultado` del data table). */
export type ResultadoFlujoCorreo =
  | "recibido"
  | "ingresado"
  | "duplicado"
  | "error"
  | "no_es_pedido";

/** Qué tan seguro estaba el clasificador de que el correo era (o no) un pedido. */
export type ConfianzaCorreo = "alta" | "media" | "baja";

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
  /** REQ-275: lo que hizo el flujo; `null` en los correos anteriores a esa columna. */
  resultado: ResultadoFlujoCorreo | null;
  confianza: ConfianzaCorreo | null;
  tipo: string | null;
  /** OV en la que quedó el correo; si son varias, separadas por coma. */
  codigoOrdenVenta: string | null;
  /** Columnas de sistema del data table de n8n (id, createdAt, updatedAt). */
  idRegistro: string | null;
  registradoEn: string | null;
  actualizadoEn: string | null;
  ingreso: IngresoCorreo | null;
}

/** Datos de un adjunto; los bytes se bajan aparte con su `indice`. */
export interface AdjuntoCorreo {
  indice: number;
  nombre: string;
  mimeType: string;
  /** Tamaño del archivo en bytes. */
  tamano: number;
}

/** El correo completo, tal como está en Gmail. El HTML no es seguro: se muestra aislado. */
export interface CorreoContenido {
  asunto: string;
  de: string;
  para: string;
  fecha: string | null;
  texto: string;
  html: string;
  adjuntos: AdjuntoCorreo[];
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

/** Mismas filas por página que el resto de las tablas del sistema. */
export const TAMANO_PAGINA_CORREOS = DEFAULT_TABLE_PAGE_SIZE;

/**
 * Correos que se piden al servidor de una vez (el máximo que acepta el api). Cada clic en
 * «siguiente» no va al servidor: se pagina sobre el bloque ya descargado.
 */
export const TAMANO_BLOQUE_CORREOS = 50;
