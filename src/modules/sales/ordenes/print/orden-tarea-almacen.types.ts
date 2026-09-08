import type { OrdenSurtidoCapturaPayload } from "../surtido/orden-surtido.types";

export interface OrdenTareaAlmacenLineaPrint {
  producto: string;
  especificacion: string;
  cantidadSolicitada: string;
  /** Campos surtidos (solo en PDF actualizado). */
  cantidadPreparada?: string;
  codigoIncidencia?: string;
  nota?: string;
  alisto?: boolean;
  reviso?: boolean;
}

export interface OrdenTareaAlmacenPrintData {
  /** UUID de la OV — necesario para el QR de captura. */
  idOrdenVenta?: string;
  folio: string;
  impresa: string;
  cliente: string;
  centroConsumo: string;
  numeroOrdenCliente: string;
  fechaEntrega: string;
  direccionEntrega: string;
  lineas: OrdenTareaAlmacenLineaPrint[];
  /** Si viene, el PDF se marca como actualizado y rellena campos manuscritos. */
  surtido?: OrdenSurtidoCapturaPayload | null;
  /** Data URL PNG del QR (generado antes de renderizar). */
  qrDataUrl?: string | null;
}
