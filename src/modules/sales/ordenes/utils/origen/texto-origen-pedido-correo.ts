const LEGAL_CUT_MARKERS = [
  /la presente comunicaci[oó]n electr[oó]nica/i,
  /this electronic communication is confidential/i,
  /el presente correo no constituye/i,
  /Redescubre lo Inesperado/i,
  /pol[ií]ticas?\s+de\s+(confidencialidad|privacidad)/i,
  /this\s+(e-?mail|electronic)\s+(and\s+any\s+)?attachments?\s+(is|are)\s+confidential/i,
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

export function isEmailChromeLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (FORWARD_HEADER_END.test(trimmed)) return true;
  if (/^-+$/.test(trimmed)) return true;
  if (HEADER_START.test(trimmed)) return true;
  if (/^\*?(?:De|From)\*?\s*:?\s*$/i.test(trimmed)) return true;
  return false;
}

const MAX_TEXTO_ORIGEN_CHARS = 12000;

export const CUERPO_BLOQUE_TEXTO = "[[texto]]";
export const CUERPO_BLOQUE_TABLA = "[[tabla]]";
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

export function splitCuerpoFila(line: string): string[] {
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

export function mergeWrappedTableLines(lines: readonly string[]): string[] {
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

export function normalizeCorreoFingerprint(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Corta disclaimers legales y colapsa hilos/replies duplicados para mostrar
 * un solo cuerpo en el cypher (sin firmar+legal repetidos 2–3 veces).
 */
export function collapseDuplicatedCorreoSegments(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  for (const marker of LEGAL_CUT_MARKERS) {
    const match = marker.exec(text);
    if (match?.index != null && match.index > 20) {
      text = text.slice(0, match.index).trim();
      break;
    }
  }

  // Segundo saludo suele abrir un reply casi idéntico en el mismo cuerpo.
  const greetingRe =
    /(?:^|\n)((?:Buenas?\s+(?:tardes?|d[ií]as?|noches?)|Hola)[,.]?[^\n]*)/gi;
  const greetings = [...text.matchAll(greetingRe)];
  if (greetings.length >= 2) {
    const second = greetings[1];
    if (second?.index != null && second.index > 40) {
      const first = text.slice(0, second.index).trim();
      if (first.length > 30) text = first;
    }
  }

  // Bloques separados por --- / ==== con contenido casi igual.
  const parts = text
    .split(/\n\s*-{3,}\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 1) {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const part of parts) {
      const key = normalizeCorreoFingerprint(part).slice(0, 160);
      if (!key || seen.has(key)) continue;
      const similar = [...seen].some((prev) => {
        const a = prev.slice(0, 80);
        const b = key.slice(0, 80);
        return a.length > 24 && b.length > 24 && (a.includes(b) || b.includes(a));
      });
      if (similar) continue;
      seen.add(key);
      unique.push(part);
    }
    text = unique.join("\n\n");
  }

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

