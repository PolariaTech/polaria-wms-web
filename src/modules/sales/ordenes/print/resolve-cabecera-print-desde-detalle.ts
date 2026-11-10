import {
  formatCapturaFecha,
  stripSurtidoFotoQrFromNotas,
} from "../utils/pedido/build-orden-venta-captura-observaciones";
import { diaSemanaEntregaEs } from "../utils/pedido/dia-semana-entrega";
import {
  fitNotasGeneralesPdf,
  looksLikeEmailHeaderJunk,
  sanitizeNotasGeneralesPedido,
} from "../utils/origen/texto-origen-pedido";

/**
 * Cabecera del PDF de almacén: detalle de venta (BD / captura del pedido).
 * No usa renglones Mateo (`Almacen`/`Fecha` de origen_correo) ni el cuerpo del correo.
 */

/** Notas del PDF = `notas_almacen` del detalle. Vacío se respeta (no reinyecta el correo). */
export function resolveNotasGeneralesDesdeDetalle(notasAlmacen: string): string {
  const deUsuario = sanitizeNotasGeneralesPedido(
    stripSurtidoFotoQrFromNotas(notasAlmacen),
  );
  if (deUsuario && !looksLikeEmailHeaderJunk(deUsuario)) {
    return fitNotasGeneralesPdf(deUsuario);
  }
  return "";
}

/** Centro = columna BD; si falta, captura en observaciones. Sin fallback a OT/Mateo. */
export function resolveCentroConsumoDesdeDetalle(input: {
  centroBd?: string | null;
  centroCaptura: string;
}): string {
  return input.centroBd?.trim() || input.centroCaptura.trim() || "";
}

/** Fecha/día = `fecha_entrega` BD; luego captura; luego pedido/creación. Sin `Fecha` de OT. */
export function resolveFechaYDiaEntregaDesdeDetalle(input: {
  fechaCaptura: string;
  fechaEntregaBd?: string | null;
  fechaPedido?: string | null;
  createdAt?: string | null;
}): { fechaEntrega: string; diaEntrega: string } {
  const fromBd = input.fechaEntregaBd?.trim();
  const fromCaptura = input.fechaCaptura.trim();
  const fallback = (input.fechaPedido || input.createdAt || "").trim();
  const fechaEntrega = fromBd
    ? formatCapturaFecha(fromBd)
    : fromCaptura
      ? formatCapturaFecha(fromCaptura)
      : fallback
        ? formatCapturaFecha(fallback)
        : "";
  return {
    fechaEntrega,
    diaEntrega: diaSemanaEntregaEs(fechaEntrega),
  };
}
