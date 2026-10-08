import type { ArchivoExtraido, ArchivoTexto } from "../ai/file-extractors";

const LEGAL_CUT_MARKERS = [
  /la presente comunicaci[oó]n electr[oó]nica/i,
  /this electronic communication is confidential/i,
  /el presente correo no constituye/i,
];

const FORWARD_HEADER_END =
  /^(?:-+)\s*Forwarded message\s*(?:-+)\.?\s*$/im;

const HEADER_START =
  /^(?:\*+)?(?:De|From|Date|Fecha|Subject|Asunto|To|Para|Cc|Cco|Bcc|Enviado el|Sent)(?:\*+)?\s*:/i;

/** Reparte cabeceras de forward aplanadas en líneas para poder limpiarlas. */
function rebreakFlattenedCorreo(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\s*(-{3,}\s*Forwarded message\s*-{3,})\.?\s*/gi, "\n$1\n")
    .replace(
      /\s+(\*?(?:De|From|Date|Fecha|Subject|Asunto|To|Para|Cc|Cco|Bcc|Enviado el|Sent)\*?\s*:)/gi,
      "\n$1",
    )
    .replace(/\s+(-{5,})\.?\s*/g, "\n$1\n");
}

function isEmailChromeLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (FORWARD_HEADER_END.test(trimmed)) return true;
  if (/^-+$/.test(trimmed)) return true;
  if (HEADER_START.test(trimmed)) return true;
  if (/^\*?(?:De|From)\*?\s*:?\s*$/i.test(trimmed)) return true;
  return false;
}

const MAX_TEXTO_ORIGEN_CHARS = 12000;

const CUERPO_BLOQUE_TEXTO = "[[texto]]";
const CUERPO_BLOQUE_TABLA = "[[tabla]]";
const CUERPO_BLOQUE_RE = /^\[\[(texto|tabla)\]\]\s*$/m;

export type OrigenPedidoBlock =
  | { type: "text"; text: string }
  | { type: "table"; rows: string[][] };

export type CuerpoMensajeBloque =
  | { tipo: "texto"; texto: string; filas: null }
  | { tipo: "tabla"; texto: null; filas: string[][] };

export function isCuerpoMensajeFormato(raw: string): boolean {
  return CUERPO_BLOQUE_RE.test(raw.trim());
}

function escapeCuerpoCelda(value: string): string {
  return value.replace(/\|/g, "/").trim();
}

function splitCuerpoFila(line: string): string[] {
  return line.split(/\s*\|\s*/).map((cell) => cell.trim());
}

/** Serializa bloques de IA para persistir en origen_texto. */
export function serializeCuerpoMensaje(
  bloques: readonly CuerpoMensajeBloque[] | null | undefined,
): string {
  if (!bloques?.length) return "";
  const parts: string[] = [];
  for (const bloque of bloques) {
    if (bloque.tipo === "tabla") {
      const filas = (bloque.filas ?? [])
        .map((row) => row.map((cell) => escapeCuerpoCelda(String(cell ?? ""))))
        .filter((row) => row.some((cell) => cell.length > 0));
      if (filas.length === 0) continue;
      parts.push(
        `${CUERPO_BLOQUE_TABLA}\n${filas.map((row) => row.join(" | ")).join("\n")}`,
      );
      continue;
    }
    const texto = (bloque.texto ?? "").trim();
    if (!texto) continue;
    parts.push(`${CUERPO_BLOQUE_TEXTO}\n${texto}`);
  }
  return parts.join("\n\n").trim();
}

function isArchivoTexto(file: ArchivoExtraido): file is ArchivoTexto {
  return file.tipo === "texto";
}

/** Tras cabeceras de correo (De/From/…), el cuerpo empieza después de la línea en blanco. */
function stripEmailHeadersBlock(text: string): string {
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length && !lines[i]!.trim()) i += 1;
  if (i >= lines.length || !HEADER_START.test(lines[i]!.trim())) {
    return text.trim();
  }
  while (i < lines.length && lines[i]!.trim()) i += 1;
  while (i < lines.length && !lines[i]!.trim()) i += 1;
  return lines.slice(i).join("\n").trim();
}

function normalizeTableWhitespace(line: string): string {
  return line.replace(/\u00a0/g, " ").replace(/\t/g, "  ");
}

function looksLikeProseBreak(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return /^(buenas?\s+|hola\b|estimado|favor de |gracias|saludos|quedo |cordial|att\.|atentam|nancy |cel\.|tel\.|carretera )/i.test(
    trimmed,
  );
}

/** Línea con columnas alineadas por espacios (salida dataTable de html-to-text). */
export function looksLikeAsciiTableRow(line: string): boolean {
  const trimmed = normalizeTableWhitespace(line).replace(/\s+$/g, "");
  if (!trimmed.trim()) return false;
  if (trimmed.trim().split(/ {2,}/).filter(Boolean).length >= 3) return true;
  return (
    /X\d{6,}/i.test(trimmed) &&
    /\b(KG|KGM|CJ|UN|STOCK|CROSSDOCK)\b/i.test(trimmed)
  );
}

function mergeWrappedTableLines(lines: readonly string[]): string[] {
  const out: string[] = [];
  for (const rawLine of lines) {
    const line = normalizeTableWhitespace(rawLine);
    const trimmed = line.trim();
    const prev = out[out.length - 1];
    if (
      prev &&
      looksLikeAsciiTableRow(prev) &&
      trimmed &&
      !looksLikeAsciiTableRow(line) &&
      !looksLikeProseBreak(trimmed) &&
      trimmed.length < 48
    ) {
      const parts = prev.replace(/[ \t]+$/g, "").split(/ {2,}/);
      let appended = false;
      for (let i = parts.length - 1; i >= 0; i -= 1) {
        const cell = parts[i]!.trim();
        if (!cell) continue;
        if (/^X\d/i.test(cell) || /^[\d.]+$/.test(cell)) continue;
        if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(cell)) {
          parts[i] = `${cell} ${trimmed}`;
          appended = true;
          break;
        }
      }
      out[out.length - 1] = appended ? parts.join("  ") : `${prev} ${trimmed}`;
      continue;
    }
    out.push(line);
  }
  return out;
}

function normalizeLinePreserveTables(line: string): string {
  if (looksLikeAsciiTableRow(line)) {
    return line.replace(/[ \t]+$/g, "");
  }
  return line.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+$/g, "");
}

/**
 * Extrae solo el cuerpo legible del mensaje (sin cabeceras de forward ni legales).
 * Conserva el espaciado de tablas ASCII para que sigan leyéndose en columnas.
 */
export function cleanCorreoBodyForNotas(raw: string): string {
  let text = rebreakFlattenedCorreo(raw).trim();
  if (!text) return "";

  // Puede haber varios forwards anidados: nos quedamos con el cuerpo tras el último.
  let forwardMatch = FORWARD_HEADER_END.exec(text);
  while (forwardMatch?.index != null) {
    text = text.slice(forwardMatch.index + forwardMatch[0].length).trim();
    forwardMatch = FORWARD_HEADER_END.exec(text);
  }

  text = stripEmailHeadersBlock(text);
  // Cabeceras sueltas que quedaron tras un forward aplanado.
  text = text
    .split("\n")
    .filter((line) => !isEmailChromeLine(line))
    .join("\n")
    .trim();

  for (const marker of LEGAL_CUT_MARKERS) {
    const match = marker.exec(text);
    if (match?.index != null && match.index > 20) {
      text = text.slice(0, match.index).trim();
      break;
    }
  }

  text = text
    .split("\n")
    .map(normalizeLinePreserveTables)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length > MAX_TEXTO_ORIGEN_CHARS) {
    text = `${text.slice(0, MAX_TEXTO_ORIGEN_CHARS).trim()}…`;
  }

  return text;
}

/** Compacta saltos de línea para que el PDF llene las N líneas sin huecos vacíos. */
export function flattenNotasForPdf(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

const GREETING_OR_FILLER =
  /^(buenas?\s+(tardes?|d[ií]as?|noches?)|buen\s+d[ií]a|hola[,.]?|estimado[as]?|estimad[oa]s?|saludos?\.?|gracias\.?|xaludos|quedo\s+(atenta|atento|pendiente|a\s+tus)|cordiales|el\s+motivo\s+de\s+mi\s+correo|adjunto\s+(el\s+)?pedido|env[ií]o\s+adjunto|para\s+hacerte\s+llegar|favor de confirmar)/i;

const TABLE_RESIDUE =
  /clave\s*sap|texto\s*breve\s+de\s+material|\bum\b.*\bpedido\b|^oc\s+generada|stock\s+x\d{5,}/i;

const SIGNATURE_OR_META =
  /contralor[ií]a|gestor de inventarios|\bxcaret\b|@|cel\.|tel\.|carretera |playa del carmen|municipio de|c\.p\./i;

function isGreetingOrFillerLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (trimmed.length <= 2) return true;
  if (GREETING_OR_FILLER.test(trimmed)) return true;
  if (SIGNATURE_OR_META.test(trimmed)) return true;
  if (TABLE_RESIDUE.test(trimmed)) return true;
  // Nombre propio suelto (firma)
  if (
    /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,4}$/.test(
      trimmed,
    )
  ) {
    return true;
  }
  // Fila de productos suelta: SKU + nombre + KG
  if (/X\d{6,}/i.test(trimmed) && /\b(KG|KGM|CJ|UN)\b/i.test(trimmed)) {
    return true;
  }
  return false;
}

/** ~3 renglones del recuadro de notas generales (hoja carta). */
export const NOTAS_GENERALES_PDF_MAX_CHARS = 160;

/** Recorta notas para que quepan en el recuadro impreso, sin cortar a media palabra. */
export function fitNotasGeneralesPdf(
  raw: string,
  maxChars = NOTAS_GENERALES_PDF_MAX_CHARS,
): string {
  const flat = flattenNotasForPdf(raw);
  if (!flat) return "";
  if (flat.length <= maxChars) return flat;
  const cut = flat.slice(0, maxChars).replace(/\s+\S*$/, "").trim();
  return cut || flat.slice(0, maxChars).trim();
}

/**
 * Detecta cuando “notas generales” trae el cuerpo del correo (forward, cabeceras, hilo)
 * en vez de una nota corta de almacén.
 */
export function looksLikeCorreoCuerpoEnNotas(raw: string): boolean {
  const text = raw.trim();
  if (!text) return false;
  if (isCuerpoMensajeFormato(text)) return true;
  if (/forwarded message/i.test(text)) return true;
  if (/\b(RV:|Fwd:|FW:)\b/i.test(text) && text.length > 200) return true;
  const headerHits = (
    text.match(
      /(?:^|\n)\s*\*?(?:De|From|Date|Fecha|Subject|Asunto|To|Para|Cc)\*?\s*:/gi,
    ) ?? []
  ).length;
  if (headerHits >= 2) return true;
  if (/@[\w.-]+\.\w+/.test(text) && text.length > NOTAS_GENERALES_PDF_MAX_CHARS) {
    return true;
  }
  return false;
}

/** Tras “extraer”, ¿sigue siendo basura de cabeceras de correo? */
export function looksLikeEmailHeaderJunk(raw: string): boolean {
  const text = flattenNotasForPdf(raw);
  if (!text) return false;
  if (/forwarded message/i.test(text)) return true;
  if (HEADER_START.test(text)) return true;
  const stripped = text
    .replace(/-{3,}.*?-{3,}\.?/gi, " ")
    .replace(
      /\*?(?:De|From|Date|Fecha|Subject|Asunto|To|Para|Cc|Cco|Bcc)\*?\s*:[^.]*\.?/gi,
      " ",
    )
    .replace(/[.\-\s*]+/g, " ")
    .trim();
  return stripped.length < 16;
}

/**
 * Notas generales de almacén.
 * - Nota corta de Polaria → se respeta.
 * - Correo / forward → saca especificaciones del cuerpo (`origenTexto` si viene).
 */
export function sanitizeNotasGeneralesPedido(
  raw: string,
  origenTexto?: string | null,
): string {
  const text = raw.trim();
  const origen = origenTexto?.trim() ?? "";

  if (
    text &&
    !looksLikeCorreoCuerpoEnNotas(text) &&
    !looksLikeEmailHeaderJunk(text)
  ) {
    return text;
  }

  const fromObservaciones = origen
    ? fitNotasGeneralesPdf(extractObservacionesClienteBlock(origen))
    : "";
  if (fromObservaciones && !looksLikeEmailHeaderJunk(fromObservaciones)) {
    return fromObservaciones;
  }

  const fromOrigen = origen
    ? fitNotasGeneralesPdf(extractNotasClaveCorreo(origen))
    : "";
  if (fromOrigen && !looksLikeEmailHeaderJunk(fromOrigen)) {
    return fromOrigen;
  }

  if (!text) return "";
  const fromRaw = fitNotasGeneralesPdf(extractNotasClaveCorreo(text));
  if (fromRaw && !looksLikeEmailHeaderJunk(fromRaw)) return fromRaw;
  return "";
}

/** Títulos de sección que suelen llevar notas útiles del cliente (cotizaciones/PDF). */
const OBSERVACIONES_CLIENTE_HEADER =
  /^(?:observaciones(?:\s+del\s+cliente)?|notas(?:\s+del\s+cliente)?|comentarios(?:\s+del\s+cliente)?|indicaciones(?:\s+del\s+cliente)?|instrucciones(?:\s+del\s+cliente)?|aviso(?:s)?(?:\s+al\s+almace[nñ])?|notas\s+generales)\s*:?\s*$/i;

/** Siguiente sección del PDF de cotización que corta el bloque de observaciones. */
const OBSERVACIONES_SECTION_END =
  /^(?:horario\s+de\s+recepci[oó]n|madurez|venta\s+por\s+pieza|vigencia|datos\s+del\s+cliente|factura\s+fiscal|condiciones|pol[ií]tica)\s*:?\s*$/i;

function salvageSpecFromLine(line: string): string {
  const trimmed = line.trim().replace(/[:.]+$/, "");
  const entregar = /para entregar\s+(.+)/i.exec(trimmed);
  if (entregar?.[1]?.trim()) {
    return entregar[1].trim().replace(/[:.]+$/, "");
  }
  if (/^hora de entrega\b/i.test(trimmed)) {
    return trimmed;
  }
  return "";
}

/**
 * Si el texto trae «Observaciones del cliente» (u homólogos), prioriza ese bloque.
 */
export function extractObservacionesClienteBlock(raw: string): string {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const kept: string[] = [];
  let inBlock = false;

  for (const line of lines) {
    const trimmed = line.trim().replace(/^[-•*]\s*/, "").trim();
    if (!trimmed) {
      if (inBlock && kept.length > 0) break;
      continue;
    }
    if (OBSERVACIONES_CLIENTE_HEADER.test(trimmed)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      if (OBSERVACIONES_SECTION_END.test(trimmed)) break;
      if (isGreetingOrFillerLine(trimmed) && !/madur|enrriad|verde|firme|hielo/i.test(trimmed)) {
        continue;
      }
      kept.push(trimmed);
    }
  }

  return flattenNotasForPdf(kept.join(". "));
}

/** Compacta trozos “el DATE en PLACE” + “Hora de entrega TIME” al estilo Polaria. */
function formatNotasEntregaAlmacen(parts: readonly string[]): string {
  const flat = parts.map((p) => p.trim()).filter(Boolean);
  if (flat.length === 0) return "";

  let fecha = "";
  let destino = "";
  let hora = "";
  const other: string[] = [];

  for (const part of flat) {
    const entregaEn =
      /^(?:el\s+)?(\d{1,2}\s+DE\s+[A-ZÁÉÍÓÚÑ]+(?:\s+DE\s+\d{4})?)\s+en\s+(.+)$/i.exec(
        part,
      );
    if (entregaEn) {
      fecha = entregaEn[1]!.trim();
      destino = entregaEn[2]!.trim().replace(/[:.]+$/, "");
      continue;
    }
    const horaMatch =
      /^hora de entrega\s+(.+)$/i.exec(part) ||
      /^(?:a\s+las\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs?|h)?)$/i.exec(part);
    if (horaMatch && /^hora de entrega/i.test(part)) {
      hora = horaMatch[1]!.trim();
      continue;
    }
    other.push(part);
  }

  const composed: string[] = [];
  if (fecha) {
    composed.push(
      hora
        ? `Entrega ${fecha} a las ${hora}`
        : `Entrega ${fecha}`,
    );
  } else if (hora) {
    composed.push(`Hora de entrega ${hora}`);
  }
  if (destino) composed.push(`Destino: ${destino}`);
  composed.push(...other);
  return flattenNotasForPdf(composed.join(". "));
}

/**
 * Solo lo clave del correo para notas generales del PDF:
 * prosa útil (notas/especificaciones), sin tablas de productos ni saludos.
 */
export function extractNotasClaveCorreo(raw: string): string {
  const prepared = cleanCorreoBodyForNotas(raw);
  // Prioridad: bloque «Observaciones del cliente» (cotizaciones / PDF).
  const fromObservaciones = extractObservacionesClienteBlock(
    isCuerpoMensajeFormato(raw) ? raw : prepared,
  );
  if (fromObservaciones) {
    return fitNotasGeneralesPdf(fromObservaciones);
  }

  const blocks = parseOrigenPedidoBlocks(
    isCuerpoMensajeFormato(raw) ? raw : prepared,
  );
  const prose = blocks
    .filter((block): block is { type: "text"; text: string } => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  if (!prose.trim()) return "";

  const kept: string[] = [];
  for (const line of prose.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (OBSERVACIONES_CLIENTE_HEADER.test(trimmed)) continue;
    if (isEmailChromeLine(trimmed)) continue;
    if (isGreetingOrFillerLine(trimmed)) {
      const salvage = salvageSpecFromLine(trimmed);
      if (salvage) kept.push(salvage);
      continue;
    }
    kept.push(trimmed);
  }

  const formatted = formatNotasEntregaAlmacen(kept);
  return formatted || flattenNotasForPdf(kept.join(". "));
}

function parseCuerpoMensajeFormato(raw: string): OrigenPedidoBlock[] | null {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!isCuerpoMensajeFormato(text)) return null;

  const blocks: OrigenPedidoBlock[] = [];
  const parts = text.split(/(?=^\[\[(?:texto|tabla)\]\]\s*$)/m);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const firstNl = trimmed.indexOf("\n");
    const marker = (firstNl === -1 ? trimmed : trimmed.slice(0, firstNl)).trim();
    const body = (firstNl === -1 ? "" : trimmed.slice(firstNl + 1)).trim();
    if (marker === CUERPO_BLOQUE_TABLA) {
      const rows = body
        .split("\n")
        .map((line) => splitCuerpoFila(line))
        .filter((row) => row.some((cell) => cell.length > 0));
      if (rows.length === 0) continue;
      const colCount = Math.max(...rows.map((row) => row.length), 0);
      blocks.push({
        type: "table",
        rows: rows.map((row) => {
          const next = [...row];
          while (next.length < colCount) next.push("");
          return next;
        }),
      });
      continue;
    }
    if (marker === CUERPO_BLOQUE_TEXTO && body) {
      blocks.push({ type: "text", text: body });
    }
  }
  return blocks.length > 0 ? blocks : null;
}

function parseAsciiOrigenPedidoBlocks(raw: string): OrigenPedidoBlock[] {
  const text = cleanCorreoBodyForNotas(raw);
  if (!text) return [];

  const lines = mergeWrappedTableLines(text.split("\n"));
  const blocks: OrigenPedidoBlock[] = [];
  let prose: string[] = [];
  let tableLines: string[] = [];

  const flushProse = () => {
    const joined = prose.join("\n").trim();
    if (joined) blocks.push({ type: "text", text: joined });
    prose = [];
  };

  const flushTable = () => {
    if (tableLines.length === 0) return;
    const rows = tableLines.map((line) =>
      line.replace(/[ \t]+$/g, "").split(/ {2,}/).map((cell) => cell.trim()),
    );
    const colCount = Math.max(...rows.map((r) => r.length), 0);
    if (colCount >= 3 && rows.length >= 1) {
      const normalized = rows.map((row) => {
        const next = [...row];
        while (next.length < colCount) next.push("");
        return next;
      });
      blocks.push({ type: "table", rows: normalized });
    } else {
      prose.push(...tableLines);
    }
    tableLines = [];
  };

  for (const line of lines) {
    if (looksLikeAsciiTableRow(line)) {
      if (prose.length) flushProse();
      tableLines.push(line);
      continue;
    }
    if (tableLines.length) flushTable();
    prose.push(line);
  }
  flushTable();
  flushProse();

  return blocks;
}

/**
 * Parte el cuerpo en prosa + tablas (formato IA [[tabla]] o ASCII de 2+ espacios).
 */
export function parseOrigenPedidoBlocks(raw: string): OrigenPedidoBlock[] {
  return parseCuerpoMensajeFormato(raw) ?? parseAsciiOrigenPedidoBlocks(raw);
}

/**
 * Texto a persistir en origen_texto / notas generales del PDF.
 * Prioridad: mensaje pegado → cuerpos de .eml → otros textos sueltos (no adjuntos).
 */
export function buildTextoOrigenPedido(
  textoPegado: string,
  archivosExtraidos: readonly ArchivoExtraido[],
): string {
  const pegado = cleanCorreoBodyForNotas(textoPegado);
  if (pegado) return pegado;

  const cuerpos = archivosExtraidos
    .filter(isArchivoTexto)
    .filter((file) => /—\s*cuerpo$/i.test(file.nombre))
    .map((file) => cleanCorreoBodyForNotas(file.contenido))
    .filter(Boolean);

  if (cuerpos.length > 0) {
    return cuerpos.join("\n\n---\n\n");
  }

  const sueltos = archivosExtraidos
    .filter(isArchivoTexto)
    .filter((file) => !file.nombre.includes(" → "))
    .map((file) => cleanCorreoBodyForNotas(file.contenido))
    .filter(Boolean);

  return sueltos.join("\n\n---\n\n");
}
