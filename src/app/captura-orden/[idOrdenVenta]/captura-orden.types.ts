export interface CapturaOrdenMetaView {
  idOrdenVenta: string;
  folio: string;
  idOrdenTrabajo: string;
  tieneCaptura: boolean;
  capturaActualizadaEn: string | null;
}
