import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import { isGarbageOcValue } from "../utils/pedido/normalize-numero-pedido";
import { toDateInputValue } from "../utils/pedido/orden-venta-create-helpers";
import { isFechaEntregaIsoValida } from "../utils/pedido/pedido-form-validation";

/**
 * Cabecera propia de la OT al cambiar de hija en el pager.
 * REQ-281: no incluye contacto / teléfono / correo (son de la OV).
 */
export type CabeceraOtDesdeHija = {
  almacen: string;
  numeroPedido: string;
  fechaIso: string;
  anden: string;
  ventanaDesde: string;
  ventanaHasta: string;
  prioridad: string;
};

export function cabeceraOtDesdeHija(hija: OrdenTrabajoHija): CabeceraOtDesdeHija {
  const first = hija.renglones[0];
  const almacen =
    hija.almacen?.trim() ||
    first?.Almacen?.trim() ||
    first?.["Numero almacen"]?.trim() ||
    "";
  const numeroPedidoRaw = hija.numeroPedido?.trim() || "";
  const numeroPedido =
    numeroPedidoRaw && !isGarbageOcValue(numeroPedidoRaw) ? numeroPedidoRaw : "";
  const fechaHija = toDateInputValue(hija.fecha);
  const fechaIso = isFechaEntregaIsoValida(fechaHija) ? fechaHija : "";
  return {
    almacen,
    numeroPedido,
    fechaIso,
    anden: first?.Anden?.trim() || "",
    ventanaDesde: first?.["Ventana desde"]?.trim() || "",
    ventanaHasta: first?.["Ventana hasta"]?.trim() || "",
    prioridad: first?.Prioridad?.trim() || "",
  };
}

/** Campos de OV que el pager NO debe reinyectar al cambiar de OT (REQ-281). */
export const CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT = [
  "contacto",
  "telefono",
  "correo",
  "direccion",
  "notas",
] as const;
