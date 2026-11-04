import { parseDecimalEs } from "@/lib/utils/decimal-es";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "../../../shared/types/sales.types";
import type { OrdenVentaLineaInput } from "../../../shared/types/sales.types";
import { buildMatchProductoLinea } from "../match/build-match-producto";
import { resolveCantidadPrecioParaPersistir } from "./persist-linea-avance";
import {
  cleanCorreoBodyForNotas,
  isCuerpoMensajeFormato,
  sanitizeNotasGeneralesPedido,
} from "../origen/texto-origen-pedido";
import { buildOrigenCorreoFromOrdenesYLineas } from "../origen/origen-correo-ordenes-trabajo";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../origen/origen-correo-ordenes-trabajo";
import { resolvePropuestaClienteMateoParaGuardar, sellarNombreClienteMateoEnOrigen } from "./resolve-cabecera-guardada";
import { buildNotasLineasText, buildOrdenVentaCapturaObservaciones } from "./build-orden-venta-captura-observaciones";
import type { LineaVentaForm } from "../../types/orden-venta-create-modal.types";
import { nombresOrigenAdjuntos } from "../origen/origen-adjuntos";
import type { OrigenAdjunto } from "../origen/origen-adjuntos";

export function textoOrigenParaPersistir(params: {
  isEditing: boolean;
  startMode: string | null;
  origenTexto: string;
}): string {
  if (!params.isEditing && params.startMode !== "docs") return "";
  return isCuerpoMensajeFormato(params.origenTexto)
    ? params.origenTexto.trim()
    : cleanCorreoBodyForNotas(params.origenTexto);
}

export function parseLineasParaEnvio(params: {
  lineas: readonly LineaVentaForm[];
  isDraft: boolean;
}): { ok: true; lineas: OrdenVentaLineaInput[] } | { ok: false; error: string } {
  const lineas: OrdenVentaLineaInput[] = [];
  for (const linea of params.lineas) {
    const parsed = lineaEnvioDesdeForm(linea, params.isDraft);
    if (!parsed.ok) return parsed;
    lineas.push(parsed.linea);
  }
  return { ok: true, lineas };
}

function lineaEnvioDesdeForm(
  linea: LineaVentaForm,
  isDraft: boolean,
): { ok: true; linea: OrdenVentaLineaInput } | { ok: false; error: string } {
  const parsedQtyPrecio = resolveCantidadPrecioParaPersistir({
    isDraft,
    cantidadInput: linea.cantidadInput,
    precioInput: linea.precioInput,
    nombreProducto: linea.nombre,
  });
  if (!parsedQtyPrecio.ok) return parsedQtyPrecio;
  const cajas = parseDecimalEs(linea.cajasInput);
  return {
    ok: true,
    linea: {
      idProducto: linea.idProducto,
      cantidadPedida: parsedQtyPrecio.cantidadPedida,
      idBodega: linea.idBodega,
      precioUnitario: parsedQtyPrecio.precioUnitario,
      cajas: cajas != null && cajas > 0 ? cajas : null,
      presentacion: linea.presentacion.trim() || null,
      unidadMedida: linea.unidadMedida.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT,
      matchProducto: buildMatchProductoLinea({
        textoCliente: linea.aliasCliente || linea.nombre,
        sugeridoMateo: linea.sugerencia
          ? {
              idProducto: linea.sugerencia.idProducto,
              nombre: linea.sugerencia.nombre,
              codigo: linea.sugerencia.codigo,
            }
          : null,
        elegidoUsuario: {
          idProducto: linea.idProducto,
          nombre: linea.nombre,
          codigo: linea.codigo,
        },
      }),
    },
  };
}

export function notasLineasParaEnvio(lineas: readonly LineaVentaForm[]): string {
  return buildNotasLineasText(
    lineas.map((linea) => ({
      nombre: linea.nombre,
      cantidad: parseDecimalEs(linea.cantidadInput) ?? 0,
      otId: linea.otId,
      idProducto: linea.idProducto || null,
      especificacion: linea.especificacion,
      descuentoPct: parseDecimalEs(linea.descuentoPctInput),
      ivaPct: linea.ivaPct,
    })),
  );
}

export function origenCorreoParaEnvio(params: {
  hijas: readonly OrdenTrabajoHija[];
  lineas: readonly LineaVentaForm[];
  origenCorreoDraft: OrigenCorreoRenglon[];
  idComprador: string;
  compradorNombreIa: string | null;
  compradorLabel: string;
}): OrigenCorreoRenglon[] {
  const nombreEnOrigen =
    (params.hijas.length > 0
      ? params.hijas
          .flatMap((hija) => hija.renglones)
          .map((row) => row["Nombre cliente"]?.trim())
          .find(Boolean)
      : params.origenCorreoDraft
          .map((row) => row["Nombre cliente"]?.trim())
          .find(Boolean)) || null;
  const propuestaMateo = resolvePropuestaClienteMateoParaGuardar({
    idComprador: params.idComprador,
    nombreIa: params.compradorNombreIa,
    label: params.compradorLabel,
    nombreEnOrigen,
  });
  const base =
    params.hijas.length > 0
      ? buildOrigenCorreoFromOrdenesYLineas({
          hijas: params.hijas,
          lineas: params.lineas.map((linea) => ({
            otId: linea.otId,
            // REQ-201: guarda el producto ya verificado para restaurarlo al reabrir.
            idProducto:
              !linea.catalogPending && linea.idProducto ? linea.idProducto : undefined,
            nombre: linea.nombre,
            codigo: linea.codigo,
            cantidad: parseDecimalEs(linea.cantidadInput) ?? 0,
            unidadMedida: linea.unidadMedida.trim() || UNIDAD_MEDIDA_VENTA_DEFAULT,
            precioUnitario: parseDecimalEs(linea.precioInput) ?? 0,
            aliasCliente: linea.aliasCliente,
          })),
        })
      : params.origenCorreoDraft;
  return sellarNombreClienteMateoEnOrigen(base, propuestaMateo);
}

export function buildPayloadEnvioOv(params: {
  codigoCuenta: string;
  lineas: OrdenVentaLineaInput[];
  idBodegaDestino: string;
  idComprador: string;
  fechaEntrega: string;
  ventanaDesde: string;
  ventanaHasta: string;
  prioridad: string;
  moneda: string;
  ordenCompraHotel: string;
  centroConsumo: string;
  vendedor: string;
  bodegaDestinoLabel: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  correo: string;
  turno: string;
  horaSalida: string;
  chofer: string;
  unidad: string;
  aceptaSustituciones: string;
  requiereLote: string;
  registrarTemperatura: string;
  origenTexto: string;
  origenArchivos: OrigenAdjunto[];
  origenCorreo: OrigenCorreoRenglon[];
  notasLineas: string;
  observaciones: string;
  idCreador: string;
  isDraft: boolean;
}) {
  return {
    codigoCuenta: params.codigoCuenta,
    idBodega: params.lineas[0]?.idBodega,
    idBodegaDestino: params.idBodegaDestino,
    idComprador: params.idComprador,
    lineas: params.lineas,
    fechaEntrega: params.fechaEntrega,
    ventanaDesde: params.ventanaDesde,
    ventanaHasta: params.ventanaHasta,
    prioridad: params.prioridad,
    moneda: params.moneda,
    ordenCompraHotel: params.ordenCompraHotel,
    centroConsumo: params.centroConsumo,
    vendedor: params.vendedor,
    bodegaDestinoLabel: params.bodegaDestinoLabel,
    direccionEntrega: params.direccion,
    anden: params.anden,
    contacto: params.contacto,
    telefono: params.telefono,
    correo: params.correo,
    turno: params.turno,
    horaSalida: params.horaSalida,
    chofer: params.chofer,
    unidad: params.unidad,
    aceptaSustituciones: params.aceptaSustituciones,
    requiereLote: params.requiereLote,
    registrarTemperatura: params.registrarTemperatura,
    origenTexto: params.origenTexto,
    origenArchivos: params.origenArchivos,
    origenCorreo: params.origenCorreo,
    notasLineas: params.notasLineas,
    notasAlmacen: sanitizeNotasGeneralesPedido(params.observaciones),
    observaciones: buildOrdenVentaCapturaObservaciones({
      fechaEntrega: params.fechaEntrega,
      ventanaDesde: params.ventanaDesde,
      ventanaHasta: params.ventanaHasta,
      prioridad: params.prioridad,
      moneda: params.moneda,
      bodegaDestino: params.bodegaDestinoLabel,
      ordenCompraHotel: params.ordenCompraHotel,
      centroConsumo: params.centroConsumo,
      vendedor: params.vendedor,
      observaciones: params.observaciones,
      direccion: params.direccion,
      anden: params.anden,
      contacto: params.contacto,
      telefono: params.telefono,
      correo: params.correo,
      turno: params.turno,
      horaSalida: params.horaSalida,
      chofer: params.chofer,
      unidad: params.unidad,
      aceptaSustituciones: params.aceptaSustituciones,
      requiereLote: params.requiereLote,
      registrarTemperatura: params.registrarTemperatura,
      origenTexto: params.origenTexto,
      origenArchivos: nombresOrigenAdjuntos(params.origenArchivos),
      notasLineas: params.notasLineas,
    }),
    idCreador: params.idCreador || null,
    guardarAvance: params.isDraft,
  };
}
