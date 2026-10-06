import { parseDecimalEs } from "@/lib/utils/decimal-es";
import { validatePedidoCabecera } from "./pedido-form-validation";

export interface OtPagerLineaRequired {
  cantidadInput: string;
  precioInput: string;
}

/**
 * Bloquea "Siguiente" en la paginación OT solo por campos obligatorios en rojo.
 * Campos opcionales vacíos (aunque vengan marcados por IA) no bloquean.
 */
export function hasOtPagerRequiredBlocking(params: {
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
  if (!params.idComprador.trim()) return true;
  if (params.exigeOc && !params.ordenCompraHotel.trim()) return true;

  const cabecera = validatePedidoCabecera({
    fechaEntrega: params.fechaEntrega,
    todayIso: params.todayIso,
    ventanaDesde: params.ventanaDesde,
    ventanaHasta: params.ventanaHasta,
  });
  if (cabecera) return true;

  if (params.lineasPagina.length === 0) return true;

  for (const linea of params.lineasPagina) {
    const cantidad = parseDecimalEs(linea.cantidadInput);
    if (cantidad === null || cantidad <= 0) return true;
    const precio = parseDecimalEs(linea.precioInput);
    if (precio === null || precio <= 0) return true;
  }

  return false;
}
