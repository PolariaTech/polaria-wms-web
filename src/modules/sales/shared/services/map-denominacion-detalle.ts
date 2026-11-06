/** Campos de denominación comercial (REQ-241) al mapear detalle de OV. */
export function mapDenominacionDetalleFields(input: {
  compradorApodo?: string | null;
  compradorOverride?: string | null;
  ordenOverride?: string | null;
}): {
  comprador_apodo: string | null;
  comprador_denominacion_comercial_override: string | null;
  denominacion_comercial_override: string | null;
} {
  const compradorApodo = input.compradorApodo?.trim() || null;
  const compradorOverride = input.compradorOverride?.trim() || null;
  const ovOverride = input.ordenOverride?.trim() || null;
  return {
    comprador_apodo: compradorApodo,
    comprador_denominacion_comercial_override: compradorOverride,
    denominacion_comercial_override: ovOverride || null,
  };
}
