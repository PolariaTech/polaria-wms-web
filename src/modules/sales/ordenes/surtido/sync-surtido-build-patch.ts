import {
  buildOrdenVentaCapturaObservaciones,
  parseOrdenVentaCapturaObservaciones,
  type OrdenVentaCapturaExtra,
  type OrdenVentaCapturaParsed,
} from "../utils/pedido/build-orden-venta-captura-observaciones";
import { campoSurtido } from "./apply-surtido-to-print";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";
import {
  appendUniqueBlockSurtido,
  nonEmptySurtido,
  parseCantidadPreparadaKg,
  parseFechaManuscritaToIso,
  type OrdenVentaLineaSurtidoPatch,
  type OrdenVentaSurtidoFlatPatch,
} from "./sync-surtido-parsers";
import {
  buildNotasLineasFromSurtido,
  buildSurtidoNotasAlmacen,
  deriveTurnoSurtido,
} from "./sync-surtido-notas-almacen";

function parsedToExtra(
  parsed: OrdenVentaCapturaParsed,
  overrides: Partial<OrdenVentaCapturaExtra> = {},
): OrdenVentaCapturaExtra {
  const ventana = parsed.ventanaEntrega;
  let ventanaDesde = "";
  let ventanaHasta = "";
  if (ventana.includes("–") || ventana.includes("-")) {
    const parts = ventana.split(/\s*[–-]\s*/);
    ventanaDesde = parts[0]?.trim() ?? "";
    ventanaHasta = parts[1]?.trim() ?? "";
  }

  return {
    fechaEntrega: parsed.fechaEntrega,
    ventanaDesde,
    ventanaHasta,
    prioridad: parsed.prioridad,
    ordenCompraHotel: parsed.ordenCompraHotel,
    centroConsumo: parsed.centroConsumo,
    vendedor: parsed.vendedor,
    observaciones: parsed.observaciones,
    moneda: parsed.moneda,
    bodegaDestino: parsed.bodegaDestino,
    direccion: parsed.direccion,
    anden: parsed.anden,
    contacto: parsed.contacto,
    telefono: parsed.telefono,
    correo: parsed.correo,
    turno: parsed.turno,
    horaSalida: parsed.horaSalida,
    chofer: parsed.chofer,
    unidad: parsed.unidad,
    aceptaSustituciones: parsed.aceptaSustituciones,
    requiereLote: parsed.requiereLote,
    registrarTemperatura: parsed.registrarTemperatura,
    origenTexto: parsed.origenTexto,
    origenArchivos: parsed.origenArchivos,
    notasLineas: parsed.notasLineas,
    ...overrides,
  };
}

/**
 * Arma el patch de OV a partir del payload IA.
 * Solo escribe valores que la foto trae llenos (no borra lo existente con vacíos).
 */
export function buildOrdenVentaPatchFromSurtido(input: {
  payload: OrdenSurtidoCapturaPayload;
  observacionesActuales: string | null | undefined;
  notasAlmacenActuales?: string | null;
  notasLineasActuales?: string | null;
  /** índice 1-based → título producto (para notas_lineas). */
  productosByIndex?: Map<number, string>;
}): {
  flat: OrdenVentaSurtidoFlatPatch;
  lineas: OrdenVentaLineaSurtidoPatch[];
} {
  const { payload } = input;
  const parsed = parseOrdenVentaCapturaObservaciones(
    input.observacionesActuales,
  );

  const turno =
    deriveTurnoSurtido(payload) ||
    nonEmptySurtido(campoSurtido(payload, "turno", "Turno que prepara"));
  const horaSalida = nonEmptySurtido(
    campoSurtido(
      payload,
      "horaSugeridaSalida",
      "Hora sugerida de salida",
      "horaSalida",
    ),
  );
  const chofer = nonEmptySurtido(campoSurtido(payload, "chofer", "Chofer"));
  const unidad = nonEmptySurtido(campoSurtido(payload, "unidad", "Unidad"));
  const centroConsumo = nonEmptySurtido(
    campoSurtido(
      payload,
      "centroConsumo",
      "Centro de consumo",
      "Centro de consumo / cocina",
    ),
  );
  const fechaEntrega = parseFechaManuscritaToIso(
    campoSurtido(payload, "fechaEntrega", "Fecha de entrega"),
  );
  const ordenCompraHotel = nonEmptySurtido(
    campoSurtido(
      payload,
      "numeroOrdenCliente",
      "ordenCompraHotel",
      "# de orden del cliente",
      "Orden de compra del cliente",
      "Orden de compra del hotel",
    ),
  );
  const direccion = nonEmptySurtido(
    campoSurtido(
      payload,
      "direccionEntrega",
      "Dirección de entrega",
      "Direccion de entrega",
    ),
  );

  const surtidoNotas = buildSurtidoNotasAlmacen(payload);
  const notasAlmacen = surtidoNotas
    ? appendUniqueBlockSurtido(input.notasAlmacenActuales ?? "", surtidoNotas)
    : null;

  const notasLineasSurtido = buildNotasLineasFromSurtido(
    payload,
    input.productosByIndex ?? new Map(),
  );
  const notasLineas = notasLineasSurtido
    ? appendUniqueBlockSurtido(input.notasLineasActuales ?? parsed.notasLineas, notasLineasSurtido)
    : null;

  const extra = parsedToExtra(parsed, {
    turno: turno ?? parsed.turno,
    horaSalida: horaSalida ?? parsed.horaSalida,
    chofer: chofer ?? parsed.chofer,
    unidad: unidad ?? parsed.unidad,
    centroConsumo: centroConsumo ?? parsed.centroConsumo,
    fechaEntrega: fechaEntrega ?? parsed.fechaEntrega,
    ordenCompraHotel: ordenCompraHotel ?? parsed.ordenCompraHotel,
    direccion: direccion ?? parsed.direccion,
    notasLineas: notasLineas ?? parsed.notasLineas,
  });
  const observaciones = buildOrdenVentaCapturaObservaciones(extra);

  const flat: OrdenVentaSurtidoFlatPatch = {};
  if (turno) flat.turno = turno;
  if (horaSalida) flat.hora_salida = horaSalida;
  if (chofer) flat.chofer = chofer;
  if (unidad) flat.unidad = unidad;
  if (centroConsumo) flat.centro_consumo = centroConsumo;
  if (fechaEntrega) flat.fecha_entrega = fechaEntrega;
  if (ordenCompraHotel) flat.orden_compra_hotel = ordenCompraHotel;
  if (direccion) flat.direccion_entrega = direccion;
  if (notasAlmacen) flat.notas_almacen = notasAlmacen;
  if (notasLineas) flat.notas_lineas = notasLineas;
  if (observaciones) flat.observaciones = observaciones;

  const lineas: OrdenVentaLineaSurtidoPatch[] = [];
  for (const linea of payload.lineas ?? []) {
    const cantidadDespachada = parseCantidadPreparadaKg(
      linea.cantidadPreparada,
    );
    if (cantidadDespachada == null) continue;
    lineas.push({
      indice: linea.indice,
      cantidadDespachada,
      notaLinea: nonEmptySurtido(linea.nota) ?? undefined,
    });
  }

  return { flat, lineas };
}