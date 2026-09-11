import {
  buildOrdenVentaCapturaObservaciones,
  parseOrdenVentaCapturaObservaciones,
  type OrdenVentaCapturaExtra,
  type OrdenVentaCapturaParsed,
} from "../utils/build-orden-venta-captura-observaciones";
import { campoSurtido } from "./apply-surtido-to-print";
import type { OrdenSurtidoCapturaPayload } from "./orden-surtido.types";

/** Patch de columnas flat de public.orden_venta (solo claves con valor). */
export type OrdenVentaSurtidoFlatPatch = {
  turno?: string;
  hora_salida?: string;
  chofer?: string;
  unidad?: string;
  notas_almacen?: string;
  notas_lineas?: string;
  observaciones?: string;
};

export type OrdenVentaLineaSurtidoPatch = {
  indice: number;
  cantidadDespachada: number;
  notaLinea?: string;
};

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function deriveTurno(payload: OrdenSurtidoCapturaPayload): string | null {
  const pm = payload.checks?.turnoPm === true;
  const noche = payload.checks?.turnoNocheAm === true;
  if (pm && noche) return "PM / Noche-AM";
  if (pm) return "PM";
  if (noche) return "Noche / AM";
  return null;
}

/** Extrae un número usable de textos tipo "5 kg", "5,0", "12.5 kilos". */
export function parseCantidadPreparadaKg(
  raw: string | null | undefined,
): number | null {
  const text = raw?.trim() ?? "";
  if (!text) return null;
  const normalized = text.replace(",", ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number.parseFloat(match[0]);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function appendUniqueBlock(base: string, block: string): string {
  const current = base.trim();
  const next = block.trim();
  if (!next) return current;
  if (!current) return next;
  if (current.includes(next)) return current;
  return `${current}\n\n${next}`;
}

function buildSurtidoNotasAlmacen(
  payload: OrdenSurtidoCapturaPayload,
): string {
  const lines: string[] = [];
  const push = (label: string, ...keys: string[]) => {
    const value = campoSurtido(payload, ...keys);
    if (value) lines.push(`${label}: ${value}`);
  };

  push("Factura asociada", "facturaAsociada", "Factura asociada");
  push("Hora comprometida", "horaComprometida", "Hora comprometida");
  push("Renglones surtidos", "renglonesSurtidosCompletos");
  push("Cajas 1.5 kg", "cajas15kg");
  push("Cajas 21 kg", "cajas21kg");
  push("Total bultos", "totalBultosCamion");
  push("Tolerancia peso %", "toleranciaPesoPct");
  push("Alistó", "alistoNombre");
  push("Alistó hora", "alistoHora");
  push("Revisó", "revisoNombre");
  push("Revisó hora", "revisoHora");
  push("Documentó", "documentoNombre");
  push("Documentó hora", "documentoHora");
  push("Despachó", "despachoNombre");
  push("Despachó hora", "despachoHora");
  push("Recepción", "recepcionNombre");
  push("Recepción cargo", "recepcionCargo");
  push("Recepción hora", "recepcionHora");
  push("Recepción motivo", "recepcionMotivo");

  const checks: string[] = [];
  if (payload.checks?.incidenciaFueraHorario) checks.push("Fuera de horario");
  if (payload.checks?.incidenciaSinFactura) checks.push("Sin factura");
  if (payload.checks?.incidenciaFacturaNoPedida) {
    checks.push("Factura no pedida");
  }
  if (payload.checks?.incidenciaNinguna) checks.push("Sin incidencias");
  if (payload.checks?.mercanciaCoincide) checks.push("Mercancía coincide");
  if (payload.checks?.mercanciaDentroTolerancia) {
    checks.push("Dentro de tolerancia");
  }
  if (payload.checks?.mercanciaFueraTolerancia) {
    checks.push("Fuera de tolerancia");
  }
  if (payload.checks?.recepcionAceptadoCompleto) {
    checks.push("Recepción completa");
  }
  if (payload.checks?.recepcionAceptadoParcial) {
    checks.push("Recepción parcial");
  }
  if (payload.checks?.recepcionRechazado) checks.push("Rechazado");
  if (payload.checks?.recepcionRetornoFactura) {
    checks.push("Retorno a factura");
  }
  if (checks.length > 0) {
    lines.push(`Checks surtido: ${checks.join(", ")}`);
  }

  const obs = payload.observacionesIa?.trim();
  if (obs) lines.push(`IA: ${obs}`);

  if (lines.length === 0) return "";
  return `Surtido (foto QR):\n${lines.join("\n")}`;
}

function buildNotasLineasFromSurtido(
  payload: OrdenSurtidoCapturaPayload,
  productosByIndex: Map<number, string>,
): string {
  const lines: string[] = [];
  for (const linea of payload.lineas ?? []) {
    const parts: string[] = [];
    if (linea.especificacion?.trim()) {
      parts.push(linea.especificacion.trim());
    }
    if (linea.cantidadPreparada?.trim()) {
      parts.push(`prep ${linea.cantidadPreparada.trim()}`);
    }
    if (linea.codigoIncidencia?.trim()) {
      parts.push(`inc ${linea.codigoIncidencia.trim()}`);
    }
    if (linea.nota?.trim()) parts.push(linea.nota.trim());
    if (parts.length === 0) continue;
    const producto =
      productosByIndex.get(linea.indice)?.trim() || `Línea ${linea.indice}`;
    lines.push(`${producto}: ${parts.join(" · ")}`);
  }
  return lines.join("\n");
}

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
    deriveTurno(payload) ||
    nonEmpty(campoSurtido(payload, "turno", "Turno que prepara"));
  const horaSalida = nonEmpty(
    campoSurtido(
      payload,
      "horaSugeridaSalida",
      "Hora sugerida de salida",
      "horaSalida",
    ),
  );
  const chofer = nonEmpty(campoSurtido(payload, "chofer", "Chofer"));
  const unidad = nonEmpty(campoSurtido(payload, "unidad", "Unidad"));

  const surtidoNotas = buildSurtidoNotasAlmacen(payload);
  const notasAlmacen = surtidoNotas
    ? appendUniqueBlock(input.notasAlmacenActuales ?? "", surtidoNotas)
    : null;

  const notasLineasSurtido = buildNotasLineasFromSurtido(
    payload,
    input.productosByIndex ?? new Map(),
  );
  const notasLineas = notasLineasSurtido
    ? appendUniqueBlock(input.notasLineasActuales ?? parsed.notasLineas, notasLineasSurtido)
    : null;

  const extra = parsedToExtra(parsed, {
    turno: turno ?? parsed.turno,
    horaSalida: horaSalida ?? parsed.horaSalida,
    chofer: chofer ?? parsed.chofer,
    unidad: unidad ?? parsed.unidad,
    notasLineas: notasLineas ?? parsed.notasLineas,
  });
  const observaciones = buildOrdenVentaCapturaObservaciones(extra);

  const flat: OrdenVentaSurtidoFlatPatch = {};
  if (turno) flat.turno = turno;
  if (horaSalida) flat.hora_salida = horaSalida;
  if (chofer) flat.chofer = chofer;
  if (unidad) flat.unidad = unidad;
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
      notaLinea: nonEmpty(linea.nota) ?? undefined,
    });
  }

  return { flat, lineas };
}
