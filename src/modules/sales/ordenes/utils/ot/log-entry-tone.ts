import type { OrdenVentaLogEntry } from "../../types/orden-venta-log.types";

/**
 * Tono visual del punto en la bitácora Cypher.
 * - crear: nacimiento de la OV
 * - progreso: confirmación, Mateo, validación humana
 * - operacion: impresión, escaneo, correo, edición rutinaria
 * - aviso: riesgo / parcial / advertencia
 * - alerta: fallo, borrado, SLA excedido
 */
export type LogEntryTone =
  | "crear"
  | "progreso"
  | "operacion"
  | "aviso"
  | "alerta";

export function resolveLogEntryTone(
  entry: Pick<OrdenVentaLogEntry, "accion" | "mensaje" | "autor">,
): LogEntryTone {
  const msg = entry.mensaje.trim().toLowerCase();
  const autor = (entry.autor ?? "").trim().toLowerCase();

  if (
    msg.includes("falló") ||
    msg.includes("fallo") ||
    msg.includes("error") ||
    msg.includes("borrada") ||
    msg.includes("desactivada") ||
    msg.includes("acceso denegado") ||
    entry.accion === "eliminacion" ||
    entry.accion === "acceso_denegado"
  ) {
    return "alerta";
  }

  // SLA / límite de tiempo en el mensaje.
  if (msg.includes("límite") || msg.includes("limite")) {
    return isLikelySlaOverLimit(msg) ? "alerta" : "aviso";
  }

  if (
    msg.includes("atrasad") ||
    msg.includes("en riesgo") ||
    msg.includes("fuera de tolerancia")
  ) {
    return "aviso";
  }

  if (
    entry.accion === "creacion" ||
    entry.accion === "sintetico" ||
    msg.includes("fue creada") ||
    msg.includes("orden creada")
  ) {
    return "crear";
  }

  if (
    autor.includes("mateo") ||
    msg.includes("mateo") ||
    msg.includes("propuso") ||
    msg.includes("validó") ||
    msg.includes("valido los") ||
    msg.includes("confirmada") ||
    msg.includes("emitido") ||
    msg.includes("enviado a bodega") ||
    msg.includes("pasa a confirm") ||
    msg.includes("pasa a alist")
  ) {
    return "progreso";
  }

  if (
    msg.includes("escaneada") ||
    msg.includes("foto de surtido") ||
    msg.includes("impres") ||
    msg.includes("editada") ||
    msg.includes("actualiz") ||
    entry.accion === "actualizacion" ||
    entry.accion === "movimiento_inventario"
  ) {
    return "operacion";
  }

  if (entry.accion === "cambio_estado") {
    return "progreso";
  }

  return "operacion";
}

function isLikelySlaOverLimit(msg: string): boolean {
  // "1 h 12 min · límite 60 min" → over
  const limiteMin = msg.match(/l[ií]mite\s+(\d+)\s*min/i);
  if (!limiteMin) return msg.includes("atrasad") || msg.includes("exced");
  const limit = Number(limiteMin[1]);
  if (!Number.isFinite(limit)) return false;

  const hours = msg.match(/(\d+)\s*h/);
  const mins = msg.match(/(\d+)\s*min/);
  let elapsed = 0;
  if (hours) elapsed += Number(hours[1]) * 60;
  // Prefer the first "X min" that is not the límite one.
  const beforeLimite = msg.split(/l[ií]mite/i)[0] ?? msg;
  const minsBefore = beforeLimite.match(/(\d+)\s*min/);
  if (minsBefore) elapsed += Number(minsBefore[1]);
  else if (mins && !hours) elapsed += Number(mins[1]);

  return elapsed > limit;
}

export function logEntryToneDotClass(tone: LogEntryTone): string {
  switch (tone) {
    case "crear":
      return "bg-polaria-teal";
    case "progreso":
      return "bg-polaria-teal shadow-[0_0_0_3px_rgba(0,229,204,0.25)]";
    case "operacion":
      return "bg-polaria-w-50";
    case "aviso":
      return "bg-polaria-warning";
    case "alerta":
      return "bg-polaria-danger";
  }
}

export function logEntryToneBadgeClass(tone: LogEntryTone): string {
  switch (tone) {
    case "crear":
    case "progreso":
      return "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal";
    case "operacion":
      return "border-polaria-w-08 bg-polaria-w-08 text-polaria-w-50";
    case "aviso":
      return "border-polaria-warning-border bg-polaria-warning-bg text-polaria-warning";
    case "alerta":
      return "border-polaria-danger-border bg-polaria-danger-bg text-polaria-danger";
  }
}

/** Extrae callout de SLA si el mensaje trae «Estado: tiempo · límite N min». */
export function extractLogSlaCallout(mensaje: string): {
  text: string;
  overLimit: boolean;
} | null {
  const match = mensaje.match(
    /([^.·\n]+):\s*([^·\n]+)\s*·\s*l[ií]mite\s+(\d+)\s*min/i,
  );
  if (!match) return null;
  const text = `${match[1]!.trim()}: ${match[2]!.trim()} · límite ${match[3]} min`;
  return { text, overLimit: isLikelySlaOverLimit(text.toLowerCase()) };
}

export function resolveLogEntryAutorBadge(
  entry: Pick<OrdenVentaLogEntry, "autor" | "mensaje">,
): string {
  const autor = entry.autor?.trim();
  if (autor) return autor;
  const msg = entry.mensaje.toLowerCase();
  if (msg.includes("mateo")) return "Mateo";
  return "Sistema";
}
