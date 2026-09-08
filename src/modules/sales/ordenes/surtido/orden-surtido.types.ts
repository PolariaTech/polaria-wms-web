/** Payload flexible de campos manuscritos / rellenados en la hoja impresa. */
export interface OrdenSurtidoLineaCaptura {
  /** Índice 1-based de la fila en la hoja. */
  indice: number;
  cantidadPreparada?: string | null;
  codigoIncidencia?: string | null;
  nota?: string | null;
  alisto?: boolean | null;
  reviso?: boolean | null;
}

export interface OrdenSurtidoCapturaPayload {
  /** Campos de cabecera o bloques sueltos detectados (clave libre → valor). */
  campos: Record<string, string>;
  lineas: OrdenSurtidoLineaCaptura[];
  /** Notas libres que no encajan en un campo tipado. */
  observacionesIa?: string | null;
}

export interface OrdenSurtidoCapturaRow {
  idCaptura: string;
  idOrdenVenta: string;
  codigoCuenta: string;
  urlFoto: string | null;
  payload: OrdenSurtidoCapturaPayload;
  modelo: string | null;
  updatedAt: string;
}
