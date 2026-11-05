/** Qué hoja de la orden de venta es: el mismo «2/9» y centro de consumo que lleva impreso. */
export interface CapturaOrdenTrabajoView {
  indice: number;
  total: number;
  centroConsumo: string;
}

export interface CapturaOrdenMetaView {
  idOrdenVenta: string;
  folio: string;
  idOrdenTrabajo: string;
  tieneCaptura: boolean;
  capturaActualizadaEn: string | null;
  /** Ausente si no se pudo resolver; la pantalla se ve igual, solo con el folio. */
  ordenTrabajo?: CapturaOrdenTrabajoView | null;
}
