export function isVentanaDesdeMayorQueHasta(
  desde: string,
  hasta: string,
): boolean {
  const from = desde.trim();
  const to = hasta.trim();
  if (!from || !to) return false;
  return from > to;
}

/** Fecha de entrega anterior a hoy: se acepta, solo advertencia. */
export function isFechaEntregaAtrasada(
  fechaEntrega: string,
  todayIso: string,
): boolean {
  const fecha = fechaEntrega.trim();
  return Boolean(fecha) && fecha < todayIso;
}

export const FECHA_ENTREGA_ATRASADA_WARNING =
  "La fecha de entrega es anterior a hoy.";

/** Se usó mañana porque el correo/PDF no trajo fecha legible. */
export const FECHA_ENTREGA_DEFAULT_WARNING =
  "Fecha por defecto (no leída del correo)";

/** Fecha de entrega usable para confirmar: ISO calendario YYYY-MM-DD. */
export function isFechaEntregaIsoValida(fechaEntrega: string): boolean {
  const raw = fechaEntrega.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(year, month - 1, day);
  return (
    dt.getFullYear() === year &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day
  );
}

export function validatePedidoCabecera(params: {
  fechaEntrega: string;
  todayIso: string;
  ventanaDesde: string;
  ventanaHasta: string;
}): { message: string; fields: readonly string[] } | null {
  if (!isFechaEntregaIsoValida(params.fechaEntrega)) {
    return {
      message: "Ingresa la fecha de entrega.",
      fields: ["fechaEntrega"],
    };
  }

  if (
    isVentanaDesdeMayorQueHasta(params.ventanaDesde, params.ventanaHasta)
  ) {
    return {
      message: 'La ventana "desde" no puede ser mayor que "hasta".',
      fields: ["ventanaDesde", "ventanaHasta"],
    };
  }

  return null;
}
