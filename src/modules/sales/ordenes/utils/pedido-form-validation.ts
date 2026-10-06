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

export function validatePedidoCabecera(params: {
  fechaEntrega: string;
  todayIso: string;
  ventanaDesde: string;
  ventanaHasta: string;
}): { message: string; fields: readonly string[] } | null {
  if (!params.fechaEntrega.trim()) {
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
