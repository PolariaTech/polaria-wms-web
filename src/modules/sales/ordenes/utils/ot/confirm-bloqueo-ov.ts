/**
 * REQ-195: motivo y disabled del botón Confirmar en el modal OV.
 */

export function resolveConfirmBloqueoReason(params: {
  step: string;
  isLoading: boolean;
  isSaving: boolean;
  hasProductos: boolean;
  lineasCount: number;
  idComprador: string;
  hasCatalogPending: boolean;
  esPorConfirmar: boolean;
  revisionMessage: string | null;
}): string | null {
  if (params.step !== "form") return null;
  if (params.isLoading || params.isSaving) return null;
  if (!params.hasProductos) {
    return "Espera a que cargue el catálogo de productos";
  }
  if (params.lineasCount === 0) return "Agrega al menos un producto";
  if (!params.idComprador.trim()) return "Falta cliente";
  if (params.hasCatalogPending) {
    return (
      params.revisionMessage ??
      "Hay productos no identificados. Elige uno del catálogo o quita la línea"
    );
  }
  if (params.esPorConfirmar && params.revisionMessage) {
    return params.revisionMessage;
  }
  return null;
}

export function isConfirmSubmitDisabled(params: {
  step: string;
  isLoading: boolean;
  isSaving: boolean;
  hasProductos: boolean;
  lineasCount: number;
  hasCatalogPending: boolean;
  idComprador: string;
}): boolean {
  return (
    params.step === "form" &&
    (params.isLoading ||
      params.isSaving ||
      !params.hasProductos ||
      params.lineasCount === 0 ||
      params.hasCatalogPending ||
      !params.idComprador.trim())
  );
}

/** REQ-182: el avance (draft) no cierra el modal; confirmar/actualizar sí. */
export function shouldCloseModalAfterSubmit(isDraft: boolean): boolean {
  return !isDraft;
}
