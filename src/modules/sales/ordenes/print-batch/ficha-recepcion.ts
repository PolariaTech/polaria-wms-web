import type { RecepcionPrefacturaEnlace } from "./recepcion-prefactura";
import {
  groupOrigenCorreoToOrdenesTrabajo,
  parseIdOrdenTrabajoFields,
  parseOrigenCorreoJson,
} from "../utils/origen/origen-correo-ordenes-trabajo";

export interface FilaFichaRecepcion {
  razonSocial: string;
  cliente: string;
  centroConsumo: string;
  origenCorreo: unknown;
}

function primero(enlace: string, cargado: string): string {
  return enlace.trim() || cargado.trim();
}

/** «2» es la posición (OT 2 de 3), no el número de la orden. */
function numeroSiNoEsPosicion(numero: string): string {
  const valor = numero.trim();
  if (/^\d{1,2}$/.test(valor)) return "";
  return valor;
}

/** Completa la pantalla con la orden. Lo que ya vino en el enlace no se pisa. */
export function fichaDesdeOrden(
  enlace: RecepcionPrefacturaEnlace,
  fila: FilaFichaRecepcion | null,
): RecepcionPrefacturaEnlace {
  const hijas = groupOrigenCorreoToOrdenesTrabajo(
    parseOrigenCorreoJson(fila?.origenCorreo),
  );
  const hija = hijas.find((item) => item.id === enlace.ot);
  const leido = parseIdOrdenTrabajoFields(enlace.ot);
  const pedido = (hija?.numeroPedido || leido.numeroPedido).trim();
  return {
    ...enlace,
    nombreEmpresa: primero(enlace.nombreEmpresa, fila?.razonSocial ?? "") || enlace.empresa,
    cliente: primero(enlace.cliente, fila?.cliente ?? ""),
    numeroOt: pedido || numeroSiNoEsPosicion(enlace.numeroOt),
    totalOt: enlace.totalOt,
    centroConsumo: primero(
      enlace.centroConsumo,
      hija?.almacen || fila?.centroConsumo || leido.centroConsumo,
    ),
  };
}
