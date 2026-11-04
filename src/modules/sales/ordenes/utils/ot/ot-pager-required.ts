export interface OtPagerLineaRequired {
  cantidadInput: string;
  precioInput: string;
}

/**
 * Antes bloqueaba "Siguiente" del pager OT por campos obligatorios en rojo.
 * REQ-233: con Cypher se navega libre entre OT; Anterior ya no bloqueaba y
 * Siguiente tampoco debe hacerlo. La validación sigue en Confirmar/Actualizar.
 */
export function hasOtPagerRequiredBlocking(_params: {
  idComprador: string;
  exigeOc: boolean;
  ordenCompraHotel: string;
  idBodegaDestino?: string;
  fechaEntrega: string;
  todayIso: string;
  ventanaDesde: string;
  ventanaHasta: string;
  lineasPagina: readonly OtPagerLineaRequired[];
}): boolean {
  return false;
}
