import { normalizeEmbedUrl } from "@/modules/admin-panel/inventario-mercancia/services/reporte-embed-url";

/** Validación Front alineada al schema de cargar/editar reporte embed. */
export function validateCuentaReporteEmbedForm(input: {
  descripcion: string;
  embedUrl: string;
}): string | null {
  if (!input.descripcion.trim()) {
    return "La descripción del reporte es obligatoria.";
  }

  try {
    normalizeEmbedUrl(input.embedUrl);
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Ingresa una URL válida (https://…).";
  }

  return null;
}
