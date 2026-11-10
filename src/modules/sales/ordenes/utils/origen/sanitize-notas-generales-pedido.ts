import {
  extractNotasClaveCorreo,
  extractObservacionesClienteBlock,
  fitNotasGeneralesPdf,
  flattenNotasForPdf,
  isCuerpoMensajeFormato,
  NOTAS_GENERALES_PDF_MAX_CHARS,
} from "./texto-origen-pedido";

const HEADER_START =
  /^(?:\*+)?(?:De|From|Date|Fecha|Subject|Asunto|To|Para|Cc|Cco|Bcc|Enviado el|Sent)(?:\*+)?\s*:/i;

/**
 * Líneas que repiten campos ya parametrizados en el formulario / PDF
 * (REQ-277) o resumenes inventados de entrega (REQ-286).
 */
const NOTAS_CAMPO_PARAMETRIZADO =
  /^(Fecha de entrega|Ventana de entrega|Prioridad|Orden de compra(?: del cliente| del hotel)?|Centro de consumo|Vendedor|Moneda|Bodega destino|Dirección de entrega|Andén|Contacto|Teléfono|Turno que prepara|Hora sugerida de salida|Chofer|Unidad|Sustituciones|Requiere lote|Registrar temperatura|Cliente|Razón social|RFC|Subtotal|Total|Archivos|Destino|Entrega|Hora de entrega)\s*:/i;

const NOTAS_RESUMEN_ENTREGA_INVENTADO =
  /^(Entrega\s+\d{1,2}\s+DE\s+[A-ZÁÉÍÓÚÑ]|Destino:\s*|Hora de entrega\b)/i;

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

/** Quita del texto de notas las líneas que solo duplican campos del formulario. */
export function stripCamposParametrizadosDeNotas(raw: string): string {
  const text = raw.trim();
  if (!text) return "";
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (NOTAS_CAMPO_PARAMETRIZADO.test(line)) return false;
      if (NOTAS_RESUMEN_ENTREGA_INVENTADO.test(line)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

/**
 * Notas generales de almacén.
 * - Nota corta de Polaria → se respeta (sin campos ya parametrizados).
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
    return stripCamposParametrizadosDeNotas(text);
  }

  const fromObservaciones = origen
    ? fitNotasGeneralesPdf(extractObservacionesClienteBlock(origen))
    : "";
  if (fromObservaciones && !looksLikeEmailHeaderJunk(fromObservaciones)) {
    return stripCamposParametrizadosDeNotas(fromObservaciones);
  }

  const fromOrigen = origen
    ? fitNotasGeneralesPdf(extractNotasClaveCorreo(origen))
    : "";
  if (fromOrigen && !looksLikeEmailHeaderJunk(fromOrigen)) {
    return stripCamposParametrizadosDeNotas(fromOrigen);
  }

  if (!text) return "";
  const fromRaw = fitNotasGeneralesPdf(extractNotasClaveCorreo(text));
  if (fromRaw && !looksLikeEmailHeaderJunk(fromRaw)) {
    return stripCamposParametrizadosDeNotas(fromRaw);
  }
  return "";
}
