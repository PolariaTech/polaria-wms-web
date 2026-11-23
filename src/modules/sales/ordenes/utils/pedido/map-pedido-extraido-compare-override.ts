import { norm } from "./map-pedido-extraido-catalog-helpers";

export function compareOverride(params: {
  fieldKey: string;
  valorDb: string;
  valorIa: string | null | undefined;
  patch: Record<string, string>;
  autoFields: Set<string>;
  warnFields: Set<string>;
  /** Si true y la ficha ya tiene valor, no lo pisa la IA (datos de comprador). */
  preferFicha?: boolean;
}): void {
  const {
    fieldKey,
    valorDb,
    valorIa,
    patch,
    autoFields,
    warnFields,
    preferFicha = false,
  } = params;
  if (valorIa == null || !String(valorIa).trim()) {
    return;
  }
  const ia = String(valorIa).trim();

  // Ficha del comprador manda: la IA solo completa huecos (evita basura del PDF/correo).
  // No entra al diálogo Inicial/Definitivo: eso solo si el usuario edita a mano (amarillo).
  if (preferFicha && valorDb.trim()) {
    return;
  }

  patch[fieldKey] = ia;
  if (norm(valorDb) === norm(ia)) {
    autoFields.add(fieldKey);
    warnFields.delete(fieldKey);
    return;
  }
  if (valorDb.trim()) {
    // Amarillo = Mateo trajo algo distinto a la ficha. El diálogo de confirmación
    // no se abre por esto; solo si el operador cambia el valor después.
    warnFields.add(fieldKey);
    autoFields.delete(fieldKey);
  } else {
    autoFields.add(fieldKey);
  }
}