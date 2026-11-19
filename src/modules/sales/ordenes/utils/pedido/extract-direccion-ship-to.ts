import { quitarContactoDeDireccion } from "./quitar-contacto-direccion";

const SHIP_TO_LABEL_RE =
  /\b(?:ship\s*to(?:\s*address)?|deliver\s*to|enviar\s*a|entregar\s*(?:en|a)|domicilio\s*de\s*entrega|direcci[oó]n\s*de\s*(?:entrega|env[ií]o))\b\s*[:\-]?\s*/i;

const SHIP_TO_STOP_RE =
  /\b(?:bill\s*to|sold\s*to|ship\s*from|invoice\b|factura\b|orden\s*de\s*compra|purchase\s*order|\bpo\s*#|cantidad\b|quantity\b|qty\b|item\b|producto\b|subtotal\b|\btotal\b|and[eé]n\b|dock\b)\b/i;

/** Etiquetas de meta (REQ-332): solo cortan si la línea EMPIEZA con ellas. */
const SHIP_TO_META_LINE_RE =
  /^(?:attn|attention|atenci[oó]n|sent\s*from|enviado\s*desde)\b/i;

/**
 * Dirección de ENTREGA desde bloque Ship To / Deliver To / Enviar a.
 * Manda sobre Bill To (facturación) cuando ambos aparecen en el documento.
 */
export function extractDireccionShipToDesdeTexto(
  texto: string | null | undefined,
): string | null {
  const raw = (texto ?? "").trim();
  if (!raw) return null;

  const match = SHIP_TO_LABEL_RE.exec(raw);
  if (!match) return null;

  const after = raw.slice(match.index + match[0].length);
  const lines: string[] = [];

  for (const line of after.split(/\r?\n/)) {
    const trimmed = line.trim().replace(/\s+/g, " ");
    if (!trimmed) {
      if (lines.length > 0) break;
      continue;
    }
    if (SHIP_TO_STOP_RE.test(trimmed)) break;
    if (/^(bill\s*to|sold\s*to)\b/i.test(trimmed)) break;
    // REQ-332: línea solo Attn/Sent From → fin; si van al final de la dirección, se limpian abajo.
    if (SHIP_TO_META_LINE_RE.test(trimmed)) break;
    const sinContacto = quitarContactoDeDireccion(trimmed);
    if (!sinContacto) continue;
    lines.push(sinContacto);
    if (lines.length >= 6) break;
  }

  return quitarContactoDeDireccion(lines.join(", "));
}
