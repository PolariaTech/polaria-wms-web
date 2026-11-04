import type { CaptureStep, StartMode } from "../../types/orden-venta-create-modal.types";

interface EstadoOvConId {
  isEditing: boolean;
  /** Id de la OV creada como borrador en esta sesión (aún no se abrió «para editar»). */
  pendingEmitId: string | null;
}

/**
 * REQ-199: la OV ya tiene id aunque no se abrió para editar: se creó un borrador al leer el
 * archivo o el mensaje, o en el primer Guardar. Con id se puede abrir Cypher y acoplar los
 * selectores a su lado.
 */
export function ovTieneIdParaCypher(estado: EstadoOvConId): boolean {
  return estado.isEditing || Boolean(estado.pendingEmitId);
}

/**
 * Botón «+» (Cypher) del encabezado del modal: con id de OV, o ya leídos los documentos y fuera
 * de la pantalla inicial (el borrador se está creando).
 */
export function puedeMostrarBotonCypher(
  estado: EstadoOvConId & { startMode: StartMode | null; step: CaptureStep },
): boolean {
  return (
    ovTieneIdParaCypher(estado) ||
    (estado.startMode === "docs" && estado.step !== "start")
  );
}
