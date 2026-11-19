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
  /^(Fecha de entrega|Ventana de entrega|Prioridad|Orden de compra(?: del cliente| del hotel)?|Centro de consumo|Vendedor|Moneda|Bodega destino|Dirección de entrega|Andén|Contacto|Teléfono|Correo|Turno que prepara|Hora sugerida de salida|Chofer|Unidad|Sustituciones|Requiere lote|Registrar temperatura|Cliente|Razón social|RFC|Subtotal|Total|Archivos|Destino|Entrega|Hora de entrega|Emisi[oó]n|Asesor|Lista|Factura|Folio)\s*:/i;

const NOTAS_RESUMEN_ENTREGA_INVENTADO =
  /^(Entrega\s+\d{1,2}\s+DE\s+[A-ZÁÉÍÓÚÑ]|Destino:\s*|Hora de entrega\b)/i;

/** Señal de instrucción real de almacén / cliente (no metadatos de PDF). */
const NOTAS_SENAL_UTIL =
  /\b(madur|and[eé]n|sin sustitut|no muy|enriad|enrriad|equivalente|domo|entregar por|sin bolsa|con hielo|no verde|no madur|urgente para almac|juego de oc|observaci[oó]n(?:es)? del cliente)\b/i;

const PEDIDO_HEADER_MARKERS = [
  /\bEmisi[oó]n\s*:/i,
  /\bAsesor\s*:/i,
  /\bPEDIDO\b[\s\S]{0,80}\bORDINARIO\b/i,
  /\bCotizaci[oó]n\s*\/\s*Pedido\b/i,
  /\bLista\s*:/i,
  /\bFactura\s*:\s*(S[ií]|No)\b/i,
] as const;

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
 * Encabezado de cotización/pedido (folio, emisión, asesor, cliente…)
 * colado como “notas generales” — no es instrucción de almacén.
 */
export function looksLikePedidoHeaderJunk(raw: string): boolean {
  const text = flattenNotasForPdf(raw).trim();
  if (!text) return false;
  if (NOTAS_SENAL_UTIL.test(text)) return false;

  const markerHits = PEDIDO_HEADER_MARKERS.filter((re) => re.test(text)).length;
  if (markerHits >= 2) return true;

  const labelHits = (
    text.match(
      /\b(Cliente|Tel[eé]fono|Correo|Emisi[oó]n|Asesor|Lista|Factura|Entrega|Folio)\s*:/gi,
    ) ?? []
  ).length;
  if (labelHits >= 3) return true;

  if (/^PEDIDO\s+\S+/i.test(text) && labelHits >= 2 && text.length < 320) {
    return true;
  }
  return false;
}

function esFragmentoParametrizado(fragment: string): boolean {
  const piece = fragment.trim().replace(/[.·•]+$/g, "").trim();
  if (!piece) return true;
  if (NOTAS_CAMPO_PARAMETRIZADO.test(piece)) return true;
  if (NOTAS_RESUMEN_ENTREGA_INVENTADO.test(piece)) return true;
  if (/^PEDIDO\s+\S+/i.test(piece) && !NOTAS_SENAL_UTIL.test(piece)) {
    return true;
  }
  return false;
}

/** Quita del texto de notas las líneas/fragmentos que solo duplican campos del formulario. */
export function stripCamposParametrizadosDeNotas(raw: string): string {
  const text = raw.trim();
  if (!text) return "";

  if (text.includes("\n")) {
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => !esFragmentoParametrizado(line))
      .join("\n")
      .trim();
  }

  // Párrafo único tipo encabezado ADP: “Emisión: …. Asesor: …. Cliente: …”
  if (/\.\s+/.test(text) && /:\s/.test(text)) {
    return text
      .split(/\.\s+/)
      .map((line) => line.trim())
      .filter((line) => !esFragmentoParametrizado(line))
      .join(". ")
      .trim();
  }

  return esFragmentoParametrizado(text) ? "" : text;
}

function limpiarNotaCorta(raw: string): string {
  const cleaned = stripCamposParametrizadosDeNotas(raw);
  if (!cleaned) return "";
  // Encabezado ADP/folio puro sigue vacío; notas flojas van por otra rama.
  if (looksLikePedidoHeaderJunk(cleaned)) return "";
  return cleaned;
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

  if (text && looksLikePedidoHeaderJunk(text)) {
    const fromJunk = limpiarNotaCorta(text);
    if (fromJunk) return fromJunk;
    // Encabezado ADP puro: no conservar el raw; seguir a origen / vacío.
  } else if (
    text &&
    !looksLikeCorreoCuerpoEnNotas(text) &&
    !looksLikeEmailHeaderJunk(text)
  ) {
    const corta = limpiarNotaCorta(text);
    if (corta) return corta;
    // REQ-340: Mateo/usuario escribió algo flojo → no tirarlo a vacío.
    if (text.length <= 200) return fitNotasGeneralesPdf(text);
  }

  const fromObservaciones = origen
    ? fitNotasGeneralesPdf(extractObservacionesClienteBlock(origen))
    : "";
  if (fromObservaciones && !looksLikeEmailHeaderJunk(fromObservaciones)) {
    const limpia = limpiarNotaCorta(fromObservaciones);
    if (limpia) return limpia;
    if (fromObservaciones.length <= 200) return fromObservaciones;
  }

  const fromOrigen = origen
    ? fitNotasGeneralesPdf(extractNotasClaveCorreo(origen))
    : "";
  if (fromOrigen && !looksLikeEmailHeaderJunk(fromOrigen)) {
    const limpia = limpiarNotaCorta(fromOrigen);
    if (limpia) return limpia;
    if (fromOrigen.length <= 200) return fromOrigen;
  }

  if (!text) return "";
  const fromRaw = fitNotasGeneralesPdf(extractNotasClaveCorreo(text));
  if (fromRaw && !looksLikeEmailHeaderJunk(fromRaw)) {
    const limpia = limpiarNotaCorta(fromRaw);
    if (limpia) return limpia;
  }
  if (
    text &&
    !looksLikePedidoHeaderJunk(text) &&
    !looksLikeCorreoCuerpoEnNotas(text) &&
    !looksLikeEmailHeaderJunk(text) &&
    text.length <= 200
  ) {
    return fitNotasGeneralesPdf(text);
  }
  return "";
}

export const MSG_NOTAS_SIN_TEXTO_ORIGEN =
  "Sin notas explícitas en el origen; revisar correo o adjunto.";

/**
 * REQ-340: al mapear desde Mateo, el form no debe quedar con notas vacías.
 * No usar al reabrir una OV donde el usuario borró a propósito (REQ-141).
 */
export function asegurarNotasGeneralesPedido(
  raw: string,
  origenTexto?: string | null,
): string {
  const sanitized = sanitizeNotasGeneralesPedido(raw, origenTexto);
  if (sanitized) return sanitized;
  const light = stripCamposParametrizadosDeNotas((raw ?? "").trim());
  if (
    light &&
    !looksLikeCorreoCuerpoEnNotas(light) &&
    !looksLikeEmailHeaderJunk(light)
  ) {
    return fitNotasGeneralesPdf(light);
  }
  const origen = (origenTexto ?? "").trim();
  if (origen) {
    const bloque = fitNotasGeneralesPdf(extractObservacionesClienteBlock(origen));
    if (bloque && !looksLikeEmailHeaderJunk(bloque)) {
      return limpiarNotaCorta(bloque) || fitNotasGeneralesPdf(bloque);
    }
    const clave = fitNotasGeneralesPdf(extractNotasClaveCorreo(origen));
    if (clave && !looksLikeEmailHeaderJunk(clave)) {
      return limpiarNotaCorta(clave) || fitNotasGeneralesPdf(clave);
    }
  }
  return MSG_NOTAS_SIN_TEXTO_ORIGEN;
}

/**
 * REQ-340: al guardar, manda el texto del form. Prioridad usuario.
 * Solo quita líneas que duplican campos; si el strip deja vacío, se conserva
 * lo que escribió el usuario (o Mateo, si el usuario no lo tocó).
 */
export function persistirNotasGeneralesDesdeForm(raw: string): string {
  const text = stripSurtidoLocal(raw);
  if (!text) return "";
  const stripped = stripCamposParametrizadosDeNotas(text);
  if (stripped) return stripped;
  // REQ-340: prioridad usuario — si escribió algo que el strip vació (p. ej. solo
  // “Andén: 3”), se conserva salvo que sea un cuerpo de correo pegado.
  if (looksLikeCorreoCuerpoEnNotas(text)) return "";
  return text;
}

function stripSurtidoLocal(raw: string): string {
  // Espejo de stripSurtidoFotoQrFromNotas (evita import circular).
  return raw
    .replace(/(?:\n\n+)?Surtido\s*\(\s*foto\s*qr\s*\)\s*:[\s\S]*$/i, "")
    .trim();
}
