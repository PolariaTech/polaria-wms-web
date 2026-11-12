import {
  formatCapturaFecha,
  stripSurtidoFotoQrFromNotas,
} from "../utils/pedido/build-orden-venta-captura-observaciones";
import { diaSemanaEntregaEs } from "../utils/pedido/dia-semana-entrega";
import { parseOrigenCorreoJson } from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  fitNotasGeneralesPdf,
  looksLikeEmailHeaderJunk,
  sanitizeNotasGeneralesPedido,
} from "../utils/origen/texto-origen-pedido";
import { leerCabeceraUsuarioSello } from "../utils/pedido/sellar-edicion-usuario-origen";

/**
 * Cabecera del PDF de almacén: detalle de venta (BD / captura del pedido).
 * No usa renglones Mateo (`Almacen`/`Fecha` de origen_correo) ni el cuerpo del correo.
 */

/**
 * REQ-032 / REQ-281: notas del PDF.
 * Con sello `_cabeceraUsuario` manda el texto del form (también vacío).
 * Sin sello: `notas_almacen`. Nunca reinyecta `origen_texto`.
 */
export function resolveNotasGeneralesDesdeDetalle(
  notasAlmacen: string,
  origenCorreo?: unknown,
): string {
  const sello = leerCabeceraUsuarioSello(parseOrigenCorreoJson(origenCorreo));
  const fuente = sello ? sello.notasGenerales : notasAlmacen;
  const deUsuario = sanitizeNotasGeneralesPedido(
    stripSurtidoFotoQrFromNotas(fuente),
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
