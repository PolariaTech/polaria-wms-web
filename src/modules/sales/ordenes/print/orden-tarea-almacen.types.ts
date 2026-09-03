export interface OrdenTareaAlmacenLineaPrint {
  producto: string;
  especificacion: string;
  cantidadSolicitada: string;
}

export interface OrdenTareaAlmacenPrintData {
  folio: string;
  impresa: string;
  cliente: string;
  centroConsumo: string;
  numeroOrdenCliente: string;
  fechaEntrega: string;
  direccionEntrega: string;
  lineas: OrdenTareaAlmacenLineaPrint[];
}
