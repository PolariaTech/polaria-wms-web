/**
 * Orden visual en Entrega tras REQ-278:
 * Fecha · Día · Hora desde · Hora hasta · contacto · dirección · notas.
 * Prioridad oculta; moneda vive en «Datos del pedido».
 */
export const ORDEN_TRAS_NOTAS_GENERALES = [
  "Fecha de entrega",
  "Día de la semana",
  "Hora desde",
  "Hora hasta",
] as const;

/** En detalle la ventana sigue siendo un solo MetaField. */
export const ORDEN_TRAS_NOTAS_GENERALES_DETALLE = [
  "Fecha de entrega",
  "Ventana de entrega",
] as const;

/** Cabecera del bloque Entrega (formulario edición). */
export const ORDEN_BLOQUE_ENTREGA_DETALLE = [
  "Fecha de entrega",
  "Día de la semana",
  "Hora desde",
  "Hora hasta",
  "Contacto del cliente",
  "Teléfono del contacto",
  "Correo del contacto",
  "Dirección de entrega",
  "Notas generales",
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
