import type { Dispatch, SetStateAction } from "react";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";
import { cabeceraOtDesdeHija } from "./cabecera-ot-desde-hija";

type SetString = Dispatch<SetStateAction<string>>;
type SetStringSet = Dispatch<SetStateAction<Set<string>>>;

/** Setters de cabecera OT que el pager / efecto rellenan desde la hija activa. */
export type SettersHidratacionOt = {
  setCentroConsumo: SetString;
  setOrdenCompraHotel: SetString;
  setReferenciaPedido: SetString;
  setFechaEntrega: SetString;
  setAnden: SetString;
  setVentanaDesde: SetString;
  setVentanaHasta: SetString;
  setPrioridad: SetString;
  setAutoFields: SetStringSet;
  setWarnFields: SetStringSet;
  setMissingFields: SetStringSet;
};

export type OpcionesHidratacionOt = {
  /**
   * Con pager multi-OT: fuerza almacén/referencia de la hija (REQ-374).
   * Sin pager (1 OT): solo rellena vacío (REQ-311).
   */
  forzarCamposOt: boolean;
};

/**
 * Copia cabecera de la OT al formulario.
 * REQ-374: también se llama en el mismo tick que `goToOtPage` (no solo en useEffect).
 */
export function hidratarFormularioDesdeHija(
  hija: OrdenTrabajoHija,
  setters: SettersHidratacionOt,
  opciones: OpcionesHidratacionOt,
): void {
  const cab = cabeceraOtDesdeHija(hija);

  if (cab.almacen) {
    if (opciones.forzarCamposOt) {
      setters.setCentroConsumo(cab.almacen);
    } else {
      setters.setCentroConsumo((prev) => prev.trim() || cab.almacen);
    }
  }
  if (cab.numeroPedido) setters.setOrdenCompraHotel(cab.numeroPedido);
  if (cab.referenciaPedido) {
    if (opciones.forzarCamposOt) {
      setters.setReferenciaPedido(cab.referenciaPedido);
    } else {
      setters.setReferenciaPedido((prev) => prev.trim() || cab.referenciaPedido);
    }
  }
  if (cab.fechaIso) setters.setFechaEntrega(cab.fechaIso);
  if (cab.anden) setters.setAnden(cab.anden);
  if (cab.ventanaDesde) setters.setVentanaDesde(cab.ventanaDesde);
  if (cab.ventanaHasta) setters.setVentanaHasta(cab.ventanaHasta);
  if (cab.prioridad) setters.setPrioridad(cab.prioridad);

  setters.setAutoFields((prev) => {
    const next = new Set(prev);
    if (cab.almacen) next.add("centroConsumo");
    if (cab.numeroPedido) next.add("ordenCompraHotel");
    if (cab.referenciaPedido) next.add("referenciaPedido");
    if (cab.fechaIso) next.add("fechaEntrega");
    if (cab.anden) next.add("anden");
    if (cab.ventanaDesde) next.add("ventanaDesde");
    if (cab.ventanaHasta) next.add("ventanaHasta");
    return next;
  });
  setters.setWarnFields((prev) => {
    const next = new Set(prev);
    next.delete("centroConsumo");
    next.delete("ordenCompraHotel");
    next.delete("referenciaPedido");
    next.delete("fechaEntrega");
    next.delete("contacto");
    next.delete("telefono");
    next.delete("correo");
    next.delete("anden");
    next.delete("ventanaDesde");
    next.delete("ventanaHasta");
    return next;
  });
  setters.setMissingFields((prev) => {
    const next = new Set(prev);
    next.delete("centroConsumo");
    next.delete("ordenCompraHotel");
    next.delete("referenciaPedido");
    next.delete("fechaEntrega");
    next.delete("contacto");
    next.delete("telefono");
    next.delete("correo");
    next.delete("anden");
    next.delete("ventanaDesde");
    next.delete("ventanaHasta");
    return next;
  });
}
