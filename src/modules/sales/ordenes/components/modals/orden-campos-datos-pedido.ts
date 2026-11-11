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

/**
 * REQ-305: en visualización, misma programación que edición (ya no un solo
 * «Ventana de entrega»).
 */
export const ORDEN_TRAS_NOTAS_GENERALES_DETALLE = [
  "Fecha de entrega",
  "Día de la semana",
  "Hora desde",
  "Hora hasta",
] as const;

/** Labels de Datos del pedido en visualización (moneda arriba; sin prioridad). */
export const LABELS_DATOS_PEDIDO_DETALLE = [
  "Cliente",
  "Código de cliente",
  "Denominación comercial",
  "RFC",
  "Orden de compra del cliente",
  "Folio de factura",
  "Centro de consumo",
  "Moneda",
  "Referencia de pedido",
  "Fecha de creación",
  "Estado",
] as const;

/** Cabecera del bloque Entrega (edición y visualización, REQ-278/305). */
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

/** Parte «06:00 – 09:00» / «06:00-09:00» en hora desde/hasta para el detalle. */
export function partirVentanaEntrega(ventana: string): {
  desde: string;
  hasta: string;
} {
  const trimmed = ventana.trim();
  if (!trimmed) return { desde: "", hasta: "" };
  const partes = trimmed.split(/\s*[–—-]\s*/).map((parte) => parte.trim());
  if (partes.length >= 2 && partes[0] && partes[1]) {
    return { desde: partes[0], hasta: partes.slice(1).join(" - ") };
  }
  return { desde: trimmed, hasta: "" };
}

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
