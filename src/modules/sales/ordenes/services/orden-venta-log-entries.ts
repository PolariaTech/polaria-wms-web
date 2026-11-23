import type { OrdenVentaLogEntry } from "../types/orden-venta-log.types";

/** Autor de creación cuando no hay evento real (ingest / sistema). Nunca el vendedor vivo. */
export const AUTOR_BITACORA_SISTEMA = "SISTEMA";

export function formatFechaLog(
  iso: string,
  timeZone = "America/Cancun",
): string {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(new Date(ms));
  } catch {
    return iso;
  }
}

const TIPOS_PREFACTURA_EN_BITACORA = new Set([
  "impresion_prefactura",
  "prefactura_aceptada",
  "impresion_pdf",
  "impresion_pdf_auto",
]);

/** Impresión, aprobación y cambios de estado se ven aunque la bitácora esté filtrada por otra OT. */
function eventoVisibleConOt(entry: OrdenVentaLogEntry, ot: string): boolean {
  const entryOt = entry.idOrdenTrabajo?.trim() || "";
  if (!entryOt || entryOt === ot || entry.accion === "cambio_estado") return true;
  const tipo = entry.payloadTipo?.trim() || "";
  return TIPOS_PREFACTURA_EN_BITACORA.has(tipo);
}

/** Entrada sintética cuando aún no hay filas de auditoría de creación. */
export function buildCreacionSintetica(params: {
  createdAt: string;
  autorNombre?: string | null;
}): OrdenVentaLogEntry {
  const autor = params.autorNombre?.trim() || AUTOR_BITACORA_SISTEMA;
  const when = params.createdAt;
  return {
    id: `sintetico-creacion-${when}`,
    createdAt: when,
    accion: "sintetico",
    mensaje: `Esta orden de trabajo fue creada el ${formatFechaLog(when)} por ${autor}.`,
    autor,
    idOrdenTrabajo: null,
  };
}

/**
 * Eventos de toda la OV (sin OT) + los de la OT pedida.
 * Sin filtro OT → todos.
 * Si el filtro deja fuera la creación (p. ej. OT reagrupada), reinyecta
 * una creación real para no inventar autor con el vendedor vivo.
 */
export function filterLogEntriesForOt(
  entries: OrdenVentaLogEntry[],
  idOrdenTrabajo?: string | null,
): OrdenVentaLogEntry[] {
  const ot = idOrdenTrabajo?.trim() || "";
  if (!ot) return entries;

  const filtered = entries.filter((entry) => eventoVisibleConOt(entry, ot));

  const hasCreacion = filtered.some(
    (entry) => entry.accion === "creacion" || entry.accion === "sintetico",
  );
  if (hasCreacion) return filtered;

  const creacion =
    entries.find((entry) => entry.accion === "creacion") ??
    entries.find((entry) => entry.accion === "sintetico");
  return creacion ? [...filtered, creacion] : filtered;
}

/** Garantiza que el historial empiece con la creación (real o sintética). */
export function ensureCreacionEntry(
  entries: OrdenVentaLogEntry[],
  fallback: { createdAt: string; autorNombre?: string | null } | null,
): OrdenVentaLogEntry[] {
  const hasCreacion = entries.some(
    (entry) => entry.accion === "creacion" || entry.accion === "sintetico",
  );
  if (hasCreacion || !fallback?.createdAt) return entries;
  return [
    ...entries,
    buildCreacionSintetica({
      createdAt: fallback.createdAt,
      autorNombre: fallback.autorNombre,
    }),
  ];
}
