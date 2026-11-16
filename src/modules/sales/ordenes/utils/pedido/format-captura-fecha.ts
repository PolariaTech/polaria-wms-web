import { parseFechaOrigen } from "../origen/materialize-ov-desde-origen";
import { formatFechaEntregaConDia } from "./dia-semana-entrega";

/**
 * Visual México/Latam: `DD-MMM-AAAA (DÍA)` (REQ-320/321).
 * Acepta ISO o slash US/LatAm; si no parsea, deja el texto.
 */
export function formatCapturaFecha(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const iso = parseFechaOrigen(trimmed);
  if (!iso) return trimmed;
  return formatFechaEntregaConDia(iso);
}
