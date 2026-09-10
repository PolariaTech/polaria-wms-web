/** Payload flexible de campos manuscritos / rellenados en la hoja impresa. */
export interface OrdenSurtidoLineaCaptura {
  /** Índice 1-based de la fila en la hoja. */
  indice: number;
  /** Texto manuscrito en Especificación (si se escribió o corrigió). */
  especificacion?: string | null;
  cantidadPreparada?: string | null;
  codigoIncidencia?: string | null;
  nota?: string | null;
  alisto?: boolean | null;
  reviso?: boolean | null;
}

/** Casillas marcadas a mano en la hoja (true = marcada con X/✓). */
export interface OrdenSurtidoChecks {
  turnoPm?: boolean | null;
  turnoNocheAm?: boolean | null;
  incidenciaFueraHorario?: boolean | null;
  incidenciaSinFactura?: boolean | null;
  incidenciaFacturaNoPedida?: boolean | null;
  incidenciaNinguna?: boolean | null;
  mercanciaCoincide?: boolean | null;
  mercanciaDentroTolerancia?: boolean | null;
  mercanciaFueraTolerancia?: boolean | null;
  recepcionAceptadoCompleto?: boolean | null;
  recepcionAceptadoParcial?: boolean | null;
  recepcionRechazado?: boolean | null;
  recepcionRetornoFactura?: boolean | null;
}

export interface OrdenSurtidoCapturaPayload {
  /**
   * Campos de texto detectados.
   * Preferir claves canónicas (horaComprometida, chofer, …) y/o etiquetas
   * visibles en la hoja ("Hora comprometida", "Chofer", …).
   */
  campos: Record<string, string>;
  /** Casillas / checks de la hoja. */
  checks: OrdenSurtidoChecks;
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
