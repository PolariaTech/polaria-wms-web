/** Convención compartida con el API Nest para vincular tareas/órdenes a una solicitud. */
export const PROCESAMIENTO_SOLICITUD_REF_PREFIX = "solicitudProcesamiento:";

export function buildProcesamientoSolicitudRef(idSolicitud: string): string {
  return `${PROCESAMIENTO_SOLICITUD_REF_PREFIX}${idSolicitud.trim()}`;
}

export function parseProcesamientoSolicitudRef(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const text = value?.trim();
    if (!text) continue;

    const idx = text.indexOf(PROCESAMIENTO_SOLICITUD_REF_PREFIX);
    if (idx >= 0) {
      const id = text
        .slice(idx + PROCESAMIENTO_SOLICITUD_REF_PREFIX.length)
        .split(/[\s|,;]/)[0]
        ?.trim();
      if (id) return id;
    }
  }

  return null;
}

export function solicitudProcesamientoTieneTareaCola(
  idSolicitud: string,
  tareas: Array<{
    id_solicitud_procesamiento?: string | null;
    titulo?: string | null;
    descripcion?: string | null;
  }>,
): boolean {
  const id = idSolicitud.trim();
  if (!id) return false;

  return tareas.some((tarea) => {
    if (tarea.id_solicitud_procesamiento?.trim() === id) return true;
    return (
      parseProcesamientoSolicitudRef(tarea.titulo, tarea.descripcion) === id
    );
  });
}
