import { sanitizeTelefonoContacto } from "./sanitize-telefono-contacto";
import { isCuerpoMensajeFormato } from "../origen/texto-origen-pedido";
import type { OrdenVentaCapturaParsed } from "./build-orden-venta-captura-observaciones-ficha";

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
  ["Correo", "correo"],
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
    correo: "",
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
  parsed.telefono = sanitizeTelefonoContacto(parsed.telefono);
  return parsed;
}
