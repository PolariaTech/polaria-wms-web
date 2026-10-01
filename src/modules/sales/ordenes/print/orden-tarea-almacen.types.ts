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
  /**
   * Clave de orden de trabajo hija (pedido|almacen).
   * Vacío = hoja única / captura legacy a nivel OV.
   */
  idOrdenTrabajo?: string;
  /** Índice 1-based de esta hoja dentro de la OV (p.ej. 2 de 18). */
  tareaIndex?: number;
  /** Total de órdenes de trabajo / hojas de esta OV. */
  tareaTotal?: number;
  folio: string;
  impresa: string;
  cliente: string;
  centroConsumo: string;
  numeroOrdenCliente: string;
  fechaEntrega: string;
  /** Ventana / hora comprometida de entrega. */
  horaEntrega: string;
  direccionEntrega: string;
  /** Notas generales de almacén (no por renglón). */
  notasGenerales: string;
  lineas: OrdenTareaAlmacenLineaPrint[];
  /** Si viene, el PDF se marca como actualizado y rellena campos manuscritos. */
  surtido?: OrdenSurtidoCapturaPayload | null;
  /** Data URL PNG del QR (generado antes de renderizar). */
  qrDataUrl?: string | null;
}
