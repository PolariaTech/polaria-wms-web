export function isVentanaDesdeMayorQueHasta(
  desde: string,
  hasta: string,
): boolean {
  const from = desde.trim();
  const to = hasta.trim();
  if (!from || !to) return false;
  return from > to;
}

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

  if (params.fechaEntrega < params.todayIso) {
    return {
      message: "La fecha de entrega no puede ser anterior a hoy.",
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
