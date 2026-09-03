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
  pushLabeled(datos, "Orden de compra del hotel", extra.ordenCompraHotel);
  pushLabeled(datos, "Centro de consumo", extra.centroConsumo);
  pushLabeled(datos, "Vendedor", extra.vendedor);
  pushLabeled(datos, "Moneda", extra.moneda);
  pushLabeled(datos, "Bodega destino", extra.bodegaDestino);
  pushLabeled(datos, "Dirección de entrega", extra.direccion);
  pushLabeled(datos, "Andén", extra.anden);
  pushLabeled(datos, "Contacto", extra.contacto);
  pushLabeled(datos, "Teléfono", extra.telefono);
  pushLabeled(datos, "Turno que prepara", extra.turno);
  pushLabeled(datos, "Hora sugerida de salida", extra.horaSalida);
  pushLabeled(datos, "Chofer", extra.chofer, ["Por asignar"]);
  pushLabeled(datos, "Unidad", extra.unidad);
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

/** Lee la ficha de captura persistida en observaciones. */
export function parseOrdenVentaCapturaObservaciones(
  raw: string | null | undefined,
): OrdenVentaCapturaParsed {
  const parsed = emptyOrdenVentaCapturaParsed();
  const text = raw?.trim() ?? "";
  if (!text) return parsed;

  const leftovers: string[] = [];

  for (const block of text.split(/\n\n+/)) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("Pedido original:")) {
      parsed.origenTexto = trimmed.replace(/^Pedido original:\s*/, "").trim();
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
    if (looksLikeProductNotes(block)) {
      noteBlocks.push(block);
    } else {
      obsBlocks.push(block);
    }
  }

  parsed.notasLineas = noteBlocks.join("\n");
  parsed.observaciones = obsBlocks.join("\n\n");
  return parsed;
}

export function notaCapturaForProducto(
  notasLineas: string,
  productoNombre: string,
): string {
  const nombre = productoNombre.trim();
  if (!nombre || !notasLineas.trim()) return "";
  const prefix = `${nombre}: `;
  for (const line of notasLineas.split("\n")) {
    if (line.startsWith(prefix)) {
      return line.slice(prefix.length).trim();
    }
  }
  return "";
}

export function formatCapturaFecha(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return value.trim();
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function tomorrowIsoDate(now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isAfterWarehouseCutoff(now = new Date()): boolean {
  const hour = now.getHours();
  return hour >= 17 || hour < 2;
}
