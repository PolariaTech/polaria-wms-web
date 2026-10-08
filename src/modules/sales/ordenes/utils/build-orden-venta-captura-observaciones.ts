import { isCuerpoMensajeFormato } from "./texto-origen-pedido";

export interface OrdenVentaCapturaExtra {
  fechaEntrega: string;
  ventanaDesde: string;
  ventanaHasta: string;
  prioridad: string;
  ordenCompraHotel: string;
  centroConsumo: string;
  vendedor: string;
  observaciones: string;
  moneda: string;
  bodegaDestino: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  turno: string;
  horaSalida: string;
  chofer: string;
  unidad: string;
  aceptaSustituciones: string;
  requiereLote: string;
  registrarTemperatura: string;
  origenTexto: string;
  origenArchivos: readonly string[];
  notasLineas: string;
}

export interface OrdenVentaCapturaParsed {
  fechaEntrega: string;
  ventanaEntrega: string;
  prioridad: string;
  ordenCompraHotel: string;
  centroConsumo: string;
  vendedor: string;
  moneda: string;
  bodegaDestino: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  turno: string;
  horaSalida: string;
  chofer: string;
  unidad: string;
  aceptaSustituciones: string;
  requiereLote: string;
  registrarTemperatura: string;
  origenTexto: string;
  origenArchivos: string[];
  notasLineas: string;
  observaciones: string;
}

const LABELED_FIELDS = [
  ["Fecha de entrega", "fechaEntrega"],
  ["Ventana de entrega", "ventanaEntrega"],
  ["Prioridad", "prioridad"],
  ["Orden de compra del cliente", "ordenCompraHotel"],
  ["Orden de compra del hotel", "ordenCompraHotel"],
  ["Centro de consumo", "centroConsumo"],
  ["Vendedor", "vendedor"],
  ["Moneda", "moneda"],
  ["Bodega destino", "bodegaDestino"],
  ["Dirección de entrega", "direccion"],
  ["Andén", "anden"],
  ["Contacto", "contacto"],
  ["Teléfono", "telefono"],
  ["Turno que prepara", "turno"],
  ["Hora sugerida de salida", "horaSalida"],
  ["Chofer", "chofer"],
  ["Unidad", "unidad"],
  ["Sustituciones", "aceptaSustituciones"],
  ["Requiere lote", "requiereLote"],
  ["Registrar temperatura", "registrarTemperatura"],
] as const;

type LabeledFieldKey = (typeof LABELED_FIELDS)[number][1];

const HIDDEN_CAPTURA_KEYS = new Set<LabeledFieldKey>([
  "turno",
  "horaSalida",
  "chofer",
  "unidad",
]);

function pushLabeled(
  lines: string[],
  label: string,
  value: string,
  skipValues: readonly string[] = [],
): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  if (skipValues.includes(trimmed)) return;
  lines.push(`${label}: ${trimmed}`);
}

/** Arma el texto de observaciones con el pedido original y datos de captura. */
export function buildOrdenVentaCapturaObservaciones(
  extra: OrdenVentaCapturaExtra,
): string | null {
  const blocks: string[] = [];

  const origen = extra.origenTexto.trim();
  if (origen) {
    blocks.push(`Pedido original:\n${origen}`);
  }

  if (extra.origenArchivos.length > 0) {
    blocks.push(`Archivos: ${extra.origenArchivos.join(", ")}`);
  }

  const datos: string[] = [];
  pushLabeled(datos, "Fecha de entrega", extra.fechaEntrega);
  if (extra.ventanaDesde.trim() || extra.ventanaHasta.trim()) {
    datos.push(
      `Ventana de entrega: ${extra.ventanaDesde.trim() || "—"} – ${extra.ventanaHasta.trim() || "—"}`,
    );
  }
  pushLabeled(datos, "Prioridad", extra.prioridad, ["Normal"]);
  pushLabeled(datos, "Orden de compra del cliente", extra.ordenCompraHotel);
  pushLabeled(datos, "Centro de consumo", extra.centroConsumo);
  pushLabeled(datos, "Vendedor", extra.vendedor);
  pushLabeled(datos, "Moneda", extra.moneda);
  pushLabeled(datos, "Bodega destino", extra.bodegaDestino);
  pushLabeled(datos, "Dirección de entrega", extra.direccion);
  pushLabeled(datos, "Andén", extra.anden);
  pushLabeled(datos, "Contacto", extra.contacto);
  pushLabeled(datos, "Teléfono", extra.telefono);
  pushLabeled(datos, "Sustituciones", extra.aceptaSustituciones);
  pushLabeled(datos, "Requiere lote", extra.requiereLote);
  pushLabeled(datos, "Registrar temperatura", extra.registrarTemperatura);

  if (datos.length > 0) {
    blocks.push(datos.join("\n"));
  }

  const notasLineas = extra.notasLineas.trim();
  if (notasLineas) {
    blocks.push(notasLineas);
  }

  const notas = extra.observaciones.trim();
  if (notas) {
    blocks.push(notas);
  }

  const text = blocks.join("\n\n").trim();
  return text || null;
}

export function emptyOrdenVentaCapturaParsed(): OrdenVentaCapturaParsed {
  return {
    fechaEntrega: "",
    ventanaEntrega: "",
    prioridad: "",
    ordenCompraHotel: "",
    centroConsumo: "",
    vendedor: "",
    moneda: "",
    bodegaDestino: "",
    direccion: "",
    anden: "",
    contacto: "",
    telefono: "",
    turno: "",
    horaSalida: "",
    chofer: "",
    unidad: "",
    aceptaSustituciones: "",
    requiereLote: "",
    registrarTemperatura: "",
    origenTexto: "",
    origenArchivos: [],
    notasLineas: "",
    observaciones: "",
  };
}

function matchLabeledLine(line: string): { key: LabeledFieldKey; value: string } | null {
  for (const [label, key] of LABELED_FIELDS) {
    const prefix = `${label}: `;
    if (line.startsWith(prefix)) {
      return { key, value: line.slice(prefix.length).trim() };
    }
  }
  return null;
}

function isKnownLabeledBlock(block: string): boolean {
  const lines = block.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return false;
  return lines.every((line) => matchLabeledLine(line) !== null);
}

function looksLikeProductNotes(block: string): boolean {
  const lines = block.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return false;
  return lines.every((line) => {
    if (matchLabeledLine(line)) return false;
    const sep = line.indexOf(": ");
    return sep > 0;
  });
}

const CAPTURA_TAIL_START =
  /^(Archivos:|Fecha de entrega: |Ventana de entrega: |Prioridad: |Orden de compra del cliente: |Orden de compra del hotel: |Centro de consumo: |Vendedor: |Moneda: |Bodega destino: |Dirección de entrega: |Andén: |Contacto: |Teléfono: |Turno que prepara: |Hora sugerida de salida: |Chofer: |Unidad: |Sustituciones: |Requiere lote: |Registrar temperatura: )/;

function peelPedidoOriginal(text: string): { origenTexto: string; rest: string } {
  const idx = text.search(/^Pedido original:\s*/m);
  if (idx === -1) return { origenTexto: "", rest: text };

  const before = text.slice(0, idx).trim();
  const after = text.slice(idx).replace(/^Pedido original:\s*/, "");
  if (!isCuerpoMensajeFormato(after) && !after.trimStart().startsWith("[[")) {
    return { origenTexto: "", rest: text };
  }

  const lines = after.split("\n");
  const origenLines: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (i > 0 && CAPTURA_TAIL_START.test(line) && !line.includes("|")) {
      break;
    }
    origenLines.push(line);
    i += 1;
  }

  return {
    origenTexto: origenLines.join("\n").trim(),
    rest: [before, lines.slice(i).join("\n").trim()].filter(Boolean).join("\n\n"),
  };
}

/** Lee la ficha de captura persistida en observaciones. */
export function parseOrdenVentaCapturaObservaciones(
  raw: string | null | undefined,
): OrdenVentaCapturaParsed {
  const parsed = emptyOrdenVentaCapturaParsed();
  const text = raw?.trim() ?? "";
  if (!text) return parsed;

  const peeled = peelPedidoOriginal(text);
  if (peeled.origenTexto) parsed.origenTexto = peeled.origenTexto;

  const leftovers: string[] = [];

  for (const block of peeled.rest.split(/\n\n+/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("Pedido original:")) {
      if (!parsed.origenTexto) {
        parsed.origenTexto = trimmed.replace(/^Pedido original:\s*/, "").trim();
      }
      continue;
    }

    if (trimmed.startsWith("[[texto]]") || trimmed.startsWith("[[tabla]]")) {
      continue;
    }

    if (trimmed.startsWith("Archivos:")) {
      parsed.origenArchivos = trimmed
        .slice("Archivos:".length)
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      continue;
    }

    if (isKnownLabeledBlock(trimmed)) {
      for (const line of trimmed.split("\n")) {
        const match = matchLabeledLine(line.trim());
        if (!match) continue;
        parsed[match.key] = match.value;
      }
      continue;
    }

    leftovers.push(trimmed);
  }

  const noteBlocks: string[] = [];
  const obsBlocks: string[] = [];
  for (const block of leftovers) {
    const keptLines: string[] = [];
    for (const line of block.split("\n")) {
      const match = matchLabeledLine(line.trim());
      if (match && HIDDEN_CAPTURA_KEYS.has(match.key)) {
        if (!parsed[match.key]) parsed[match.key] = match.value;
        continue;
      }
      keptLines.push(line);
    }
    const kept = keptLines.join("\n").trim();
    if (!kept) continue;
    if (looksLikeProductNotes(kept)) {
      noteBlocks.push(kept);
    } else {
      obsBlocks.push(kept);
    }
  }

  parsed.notasLineas = noteBlocks.join("\n");
  parsed.observaciones = obsBlocks.join("\n\n");
  return parsed;
}

function normalizeQtyKey(cantidad: number): string {
  if (!Number.isFinite(cantidad)) return "";
  const rounded = Math.round(cantidad * 1000) / 1000;
  return String(rounded);
}

/** Clave de nota de línea acotada a OT + producto + cantidad. */
export function formatNotaLineaKey(input: {
  nombre: string;
  cantidad: number;
  otId?: string | null;
}): string {
  const nombre = input.nombre.trim();
  const qty = normalizeQtyKey(input.cantidad);
  const ot = input.otId?.trim() || "";
  if (ot && qty) return `ot:${ot}|${nombre}|${qty}`;
  if (ot) return `ot:${ot}|${nombre}`;
  if (qty) return `${nombre}|${qty}`;
  return nombre;
}

export function notaCapturaForProducto(
  notasLineas: string,
  productoNombre: string,
): string {
  return notaCapturaForLinea(notasLineas, {
    nombre: productoNombre,
    allowUnscoped: true,
  });
}

/**
 * Lee la especificación de una línea.
 * Prioridad: ot+nombre+qty → ot+nombre → nombre+qty → (opcional) nombre solo.
 * El formato legado `PRODUCTO: nota` no se aplica a otra OT si hay contexto otId.
 */
export function notaCapturaForLinea(
  notasLineas: string,
  input: {
    nombre: string;
    cantidad?: number;
    otId?: string | null;
    /** Solo para vistas sin OT (o compat). Con otId suele ir false. */
    allowUnscoped?: boolean;
  },
): string {
  const nombre = input.nombre.trim();
  if (!nombre || !notasLineas.trim()) return "";

  const qty =
    input.cantidad != null && Number.isFinite(input.cantidad)
      ? normalizeQtyKey(input.cantidad)
      : "";
  const ot = input.otId?.trim() || "";
  const allowUnscoped = input.allowUnscoped === true && !ot;

  const candidates: string[] = [];
  if (ot && qty) candidates.push(`ot:${ot}|${nombre}|${qty}: `);
  if (ot) candidates.push(`ot:${ot}|${nombre}: `);
  if (qty) candidates.push(`${nombre}|${qty}: `);
  if (allowUnscoped) candidates.push(`${nombre}: `);

  for (const prefix of candidates) {
    for (const line of notasLineas.split("\n")) {
      if (line.startsWith(prefix)) {
        return stripSurtidoMetaFromEspecificacion(
          line.slice(prefix.length).trim(),
        );
      }
    }
  }
  return "";
}

export function buildNotasLineasText(
  lineas: readonly {
    nombre: string;
    cantidad: number;
    otId?: string | null;
    especificacion: string;
    descuentoPct?: number | null;
    ivaPct?: string | null;
  }[],
): string {
  return lineas
    .flatMap((linea) => {
      const bits: string[] = [];
      if (linea.especificacion.trim()) {
        bits.push(linea.especificacion.trim());
      }
      if (linea.descuentoPct != null && linea.descuentoPct > 0) {
        bits.push(`desc ${linea.descuentoPct}%`);
      }
      if (linea.ivaPct && linea.ivaPct !== "0") {
        bits.push(`IVA ${linea.ivaPct}%`);
      }
      if (bits.length === 0) return [];
      const key = formatNotaLineaKey({
        nombre: linea.nombre,
        cantidad: linea.cantidad,
        otId: linea.otId,
      });
      return [`${key}: ${bits.join(" · ")}`];
    })
    .join("\n");
}

/** Quita prep/inc que no pertenecen a la columna Especificación del PDF. */
export function stripSurtidoMetaFromEspecificacion(raw: string): string {
  return raw
    .replace(/\s*·\s*prep\s+[^·]+/gi, "")
    .replace(/\s*·\s*inc\s+[A-Za-z0-9]+/gi, "")
    .replace(/\s*·\s*$/g, "")
    .trim();
}

/**
 * Quita el bloque que el sync de surtido (foto QR) appendea a `notas_almacen`.
 * Ese bloque no es “Notas generales” del pedido.
 */
export function stripSurtidoFotoQrFromNotas(raw: string): string {
  return raw
    .replace(/(?:\n\n+)?Surtido\s*\(\s*foto\s*qr\s*\)\s*:[\s\S]*$/i, "")
    .trim();
}

export function formatCapturaFecha(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return value.trim();
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function todayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function tomorrowIsoDate(now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  return todayIsoDate(date);
}

export function isAfterWarehouseCutoff(now = new Date()): boolean {
  const hour = now.getHours();
  return hour >= 17 || hour < 2;
}
