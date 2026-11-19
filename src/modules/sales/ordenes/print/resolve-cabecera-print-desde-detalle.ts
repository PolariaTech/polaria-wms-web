import {
  formatCapturaFecha,
  stripSurtidoFotoQrFromNotas,
} from "../utils/pedido/build-orden-venta-captura-observaciones";
import { diaSemanaEntregaEs } from "../utils/pedido/dia-semana-entrega";
import { parseOrigenCorreoJson } from "../utils/origen/origen-correo-ordenes-trabajo";
import {
  fitNotasGeneralesPdf,
  looksLikeCorreoCuerpoEnNotas,
  looksLikeEmailHeaderJunk,
  persistirNotasGeneralesDesdeForm,
  sanitizeNotasGeneralesPedido,
} from "../utils/origen/texto-origen-pedido";
import { leerCabeceraUsuarioSello } from "../utils/pedido/sellar-edicion-usuario-origen";

/**
 * Cabecera del PDF de almacén: detalle de venta (BD / captura del pedido).
 * No usa renglones Mateo (`Almacen`/`Fecha` de origen_correo) ni el cuerpo del correo.
 */

type DetalleNotasPrint = {
  notas_almacen?: string | null;
  origen_correo?: unknown;
};

/**
 * REQ-032 / REQ-281 / REQ-340: notas del PDF.
 * Con sello `_cabeceraUsuario` manda el texto del form (también vacío = borró).
 * Sin sello: `notas_almacen`. Nunca reinyecta `origen_texto`.
 * Si hay texto guardado, no lo vaciamos al re-sanitizar (prioridad usuario/Mateo persistido).
 */
export function resolveNotasGeneralesDesdeDetalle(
  notasAlmacenOrDetalle: string | DetalleNotasPrint,
  origenCorreo?: unknown,
): string {
  const notasAlmacen =
    typeof notasAlmacenOrDetalle === "string"
      ? notasAlmacenOrDetalle
      : notasAlmacenOrDetalle.notas_almacen?.trim() || "";
  const origen =
    typeof notasAlmacenOrDetalle === "string"
      ? origenCorreo
      : notasAlmacenOrDetalle.origen_correo;
  const sello = leerCabeceraUsuarioSello(parseOrigenCorreoJson(origen));
  const fuente = sello ? sello.notasGenerales : notasAlmacen;
  const raw = stripSurtidoFotoQrFromNotas(fuente).trim();
  if (!raw) return "";
  // Texto ya persistido (usuario o Mateo): mostrar con strip suave.
  const persistido = persistirNotasGeneralesDesdeForm(raw);
  if (persistido) return fitNotasGeneralesPdf(persistido);
  if (looksLikeCorreoCuerpoEnNotas(raw) || looksLikeEmailHeaderJunk(raw)) {
    const cleaned = sanitizeNotasGeneralesPedido(raw);
    return cleaned ? fitNotasGeneralesPdf(cleaned) : "";
  }
  return fitNotasGeneralesPdf(raw);
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
