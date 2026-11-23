import type { ArchivoExtraido, ArchivoTexto } from "../../ai/file-extractors";
import { withCorreoChromePreserved } from "./correo-chrome";
import {
  CUERPO_BLOQUE_TABLA,
  CUERPO_BLOQUE_TEXTO,
  cleanCorreoBodyForNotas,
  collapseDuplicatedCorreoSegments,
  isCuerpoMensajeFormato,
  isEmailChromeLine,
  looksLikeAsciiTableRow,
  mergeWrappedTableLines,
  normalizeCorreoFingerprint,
  splitCuerpoFila,
  type OrigenPedidoBlock,
} from "./texto-origen-pedido-correo";

/**
 * Prepara el cuerpo del correo para el cypher: limpia cabeceras/legal y
 * evita mostrar el mismo mensaje (o reply casi idéntico) dos o tres veces.
 */
export function prepareCorreoBodyForCypherDisplay(raw: string): string {
  const source = raw.trim();
  if (!source) return "";

  if (isCuerpoMensajeFormato(source)) {
    const blocks = parseOrigenPedidoBlocks(source);
    const seen = new Set<string>();
    const textParts: string[] = [];
    for (const block of blocks) {
      if (block.type !== "text") continue;
      const cleaned = collapseDuplicatedCorreoSegments(
        cleanCorreoBodyForNotas(block.text) || block.text,
      );
      if (!cleaned) continue;
      const key = normalizeCorreoFingerprint(cleaned).slice(0, 160);
      if (!key || seen.has(key)) continue;
      const similar = [...seen].some((prev) => {
        const a = prev.slice(0, 80);
        const b = key.slice(0, 80);
        return a.length > 24 && b.length > 24 && (a.includes(b) || b.includes(a));
      });
      if (similar) continue;
      seen.add(key);
      textParts.push(cleaned);
    }
    // REQ-132: además del primer texto útil, anexar tablas como filas legibles
    // (antes se omitían y el EML/correo perdía el formato de tabla en Cypher).
    const tableParts: string[] = [];
    for (const block of blocks) {
      if (block.type !== "table" || block.rows.length === 0) continue;
      const lines = block.rows.map((row) =>
        row.map((cell) => cell.trim()).filter(Boolean).join(" | "),
      );
      const body = lines.filter(Boolean).join("\n");
      if (body) tableParts.push(body);
    }
    const prose = textParts[0] ?? "";
    if (tableParts.length === 0) return prose;
    if (!prose) return tableParts.join("\n\n");
    return `${prose}\n\n${tableParts.join("\n\n")}`;
  }

  return collapseDuplicatedCorreoSegments(
    cleanCorreoBodyForNotas(source) || source,
  );
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

/**
 * REQ-286 / REQ-277: fecha, destino y hora ya van a campos del formulario.
 * Aquí solo se conservan especificaciones libres (madurez, andén libre, etc.).
 */
function formatNotasEntregaAlmacen(parts: readonly string[]): string {
  const other: string[] = [];

  for (const part of parts.map((p) => p.trim()).filter(Boolean)) {
    if (
      /^(?:el\s+)?(\d{1,2}\s+DE\s+[A-ZÁÉÍÓÚÑ]+(?:\s+DE\s+\d{4})?)\s+en\s+(.+)$/i.test(
        part,
      )
    ) {
      continue;
    }
    if (/^hora de entrega\s+/i.test(part)) {
      continue;
    }
    other.push(part);
  }

  return flattenNotasForPdf(other.join(". "));
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

function isArchivoTexto(file: ArchivoExtraido): file is ArchivoTexto {
  return file.tipo === "texto";
}

/**
 * Texto a persistir en origen_texto / notas generales del PDF.
 * Prioridad: mensaje pegado → cuerpos de .eml → otros textos sueltos (no adjuntos).
 */
export function buildTextoOrigenPedido(
  textoPegado: string,
  archivosExtraidos: readonly ArchivoExtraido[],
): string {
  const pegado = withCorreoChromePreserved(
    textoPegado,
    cleanCorreoBodyForNotas,
  );
  if (pegado) return pegado;

  const cuerpos = archivosExtraidos
    .filter(isArchivoTexto)
    .filter((file) => /—\s*cuerpo$/i.test(file.nombre))
    .map((file) =>
      withCorreoChromePreserved(file.contenido, cleanCorreoBodyForNotas),
    )
    .filter(Boolean);

  if (cuerpos.length > 0) {
    return cuerpos.join("\n\n---\n\n");
  }

  const sueltos = archivosExtraidos
    .filter(isArchivoTexto)
    .filter((file) => !file.nombre.includes(" → "))
    .map((file) =>
      withCorreoChromePreserved(file.contenido, cleanCorreoBodyForNotas),
    )
    .filter(Boolean);

  return sueltos.join("\n\n---\n\n");
}
