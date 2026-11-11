export type CreateModalCaptureStep = "start" | "preview" | "pickOt" | "form";

export type CreateModalStartMode = "docs" | "scratch" | "first_time" | null;

/** Título del PolariaFormModal de captura/edición de OV. */
export function tituloCreateModalOv(params: {
  isEditing: boolean;
  step: CreateModalCaptureStep;
  folioVisible: string;
  soloLectura?: boolean;
}): string {
  const { isEditing, step, folioVisible, soloLectura } = params;
  if (soloLectura && isEditing) {
    return folioVisible ? `Ver · ${folioVisible}` : "Ver pedido";
  }
  if (isEditing && step === "pickOt") return "Órdenes de trabajo";
  if (isEditing) {
    return folioVisible ? `Editar · ${folioVisible}` : "Editar pedido";
  }
  if (step === "form") {
    return folioVisible ? `Pedido · ${folioVisible}` : "Pedido";
  }
  if (step === "preview") return "Órdenes de trabajo detectadas";
  return "Nuevo pedido";
}

/**
 * Subtítulo del modal. En edición no se muestra instrucción de folio
 * (REQ-220): el título ya identifica el pedido.
 */
export function descriptionCreateModalOv(params: {
  isEditing: boolean;
  step: CreateModalCaptureStep;
  formDescription: string;
  startMode: CreateModalStartMode;
  soloLectura?: boolean;
  editLockHolderNombre?: string | null;
}): string | undefined {
  const {
    isEditing,
    step,
    formDescription,
    startMode,
    soloLectura,
    editLockHolderNombre,
  } = params;
  if (soloLectura && isEditing) {
    const quien = editLockHolderNombre?.trim() || "Otro usuario";
    return `${quien} está editando este pedido · solo lectura`;
  }
  if (isEditing && step === "pickOt") {
    return "Elige qué orden de trabajo quieres editar";
  }
  if (isEditing) return undefined;
  if (step === "form") return formDescription;
  if (step === "preview") {
    return "Previsualización antes de confirmar el formulario";
  }
  if (startMode === "docs") {
    return "Mateo lee el mensaje o los archivos del pedido";
  }
  return "¿Cómo quieres empezar?";
}
