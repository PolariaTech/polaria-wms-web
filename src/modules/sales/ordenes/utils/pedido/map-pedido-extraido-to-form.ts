import type { PedidoExtraido } from "../../ai/openai-pedido.client";
import type { ProductoVentaOption } from "../../../shared/types/sales.types";
import { sanitizeTelefonoContacto } from "./sanitize-telefono-contacto";
import {
  collectMissingFieldsDocs,
  type CampoOperativoDocs,
} from "./empaque-lineas";
import { applyPedidoCabeceraToPatch } from "./map-pedido-extraido-apply-cabecera";
import { buildLineasVentaFromPedido } from "./map-pedido-extraido-build-lineas";
import type {
  CampoDiscrepancia,
  LineaVentaFromIa,
  PedidoIaFormPatch,
  PedidoIaFichaCabecera,
  SugerenciaProductoCatalogo,
} from "./map-pedido-extraido-to-form.types";

export type {
  CampoDiscrepancia,
  LineaVentaFromIa,
  PedidoIaFormPatch,
  SugerenciaProductoCatalogo,
};

/**
 * Traduce PedidoExtraido al estado del modal.
 * Entrega (dirección, andén, contacto, teléfono, correo, ventana): lo que
 * Mateo leyó del correo, mensaje o PDF manda; la ficha del comprador solo
 * rellena lo que el documento no trajo.
 */
export function mapPedidoExtraidoToForm(params: {
  pedido: PedidoExtraido;
  productos: ProductoVentaOption[];
  ficha: PedidoIaFichaCabecera;
  tomorrowIso: string;
  todayIso: string;
}): PedidoIaFormPatch {
  const { pedido, productos, ficha, tomorrowIso, todayIso } = params;

  const { patch, autoFields, warnFields, discrepancias } = applyPedidoCabeceraToPatch({
    pedido,
    ficha,
    tomorrowIso,
    todayIso,
  });

  const lineas = buildLineasVentaFromPedido({ pedido, productos });

  const operativoValues = {
    fechaEntrega: patch.fechaEntrega,
    centroConsumo: patch.centroConsumo,
    direccion: patch.direccion,
    anden: patch.anden,
    contacto: patch.contacto,
    telefono: sanitizeTelefonoContacto(patch.telefono),
    correo: patch.correo,
    ventanaDesde: patch.ventanaDesde,
    ventanaHasta: patch.ventanaHasta,
  } satisfies Record<CampoOperativoDocs, string>;

  const missingFields = collectMissingFieldsDocs(operativoValues);

  return {
    fechaEntrega: patch.fechaEntrega,
    centroConsumo: patch.centroConsumo,
    observaciones: patch.observaciones,
    ordenCompraHotel: patch.ordenCompraHotel,
    direccion: patch.direccion,
    anden: patch.anden,
    contacto: patch.contacto,
    telefono: sanitizeTelefonoContacto(patch.telefono),
    correo: patch.correo,
    ventanaDesde: patch.ventanaDesde,
    ventanaHasta: patch.ventanaHasta,
    aceptaSustituciones: patch.aceptaSustituciones,
    requiereLote: patch.requiereLote,
    registrarTemperatura: patch.registrarTemperatura,
    autoFields,
    warnFields,
    missingFields,
    discrepancias,
    lineas,
    advertencia: pedido.advertencia,
    archivosNoLegibles: pedido.archivosNoLegibles ?? [],
  };
}