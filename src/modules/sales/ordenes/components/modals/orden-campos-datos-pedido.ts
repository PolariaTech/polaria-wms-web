/**
 * Bloque de logística en Entrega (REQ-254), orden tras Notas (REQ-216).
 * 1 Prioridad · 2 Moneda · 3 Fecha · 4 Ventana desde · 5 Ventana hasta
 */
export const ORDEN_TRAS_NOTAS_GENERALES = [
  "Prioridad",
  "Moneda",
  "Fecha de entrega",
  "Ventana de entrega — desde",
  "Ventana de entrega — hasta",
] as const;

/** En detalle la ventana es un solo MetaField. */
export const ORDEN_TRAS_NOTAS_GENERALES_DETALLE = [
  "Prioridad",
  "Moneda",
  "Fecha de entrega",
  "Ventana de entrega",
] as const;

/** Cabecera del bloque Entrega (REQ-254). */
export const ORDEN_BLOQUE_ENTREGA_DETALLE = [
  "Notas generales",
  ...ORDEN_TRAS_NOTAS_GENERALES_DETALLE,
  "Dirección de entrega",
  "Contacto del cliente",
  "Teléfono del contacto",
  "Correo del contacto",
] as const;

export function ordenTrasNotasEsCorrecto(
  labelsTrasNotas: readonly string[],
  esperado: readonly string[],
): boolean {
  if (labelsTrasNotas.length < esperado.length) return false;
  return esperado.every((label, indice) => labelsTrasNotas[indice] === label);
}

export function ordenBloqueEntregaEsCorrecto(
  labelsEntrega: readonly string[],
): boolean {
  if (labelsEntrega.length < ORDEN_BLOQUE_ENTREGA_DETALLE.length) return false;
  return ORDEN_BLOQUE_ENTREGA_DETALLE.every(
    (label, indice) => labelsEntrega[indice] === label,
  );
}
