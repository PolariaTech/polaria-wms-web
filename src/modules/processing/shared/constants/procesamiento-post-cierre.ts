/** Roles de devolución post-cierre (referencia frio: procesado | desperdicio/sobrante). */
export type RolDevolucionProcesamiento = "procesado" | "desperdicio";

const ROL_DEVOLUCION_PREFIX = "rolDevolucion:";

export function parseRolDevolucionProcesamiento(
  ...values: Array<string | null | undefined>
): RolDevolucionProcesamiento | null {
  for (const value of values) {
    const text = value?.trim();
    if (!text) continue;

    const idx = text.indexOf(ROL_DEVOLUCION_PREFIX);
    if (idx < 0) continue;

    const rol = text
      .slice(idx + ROL_DEVOLUCION_PREFIX.length)
      .split(/[\s|,;]/)[0]
      ?.trim()
      .toLowerCase();

    if (rol === "procesado" || rol === "desperdicio") return rol;
  }

  return null;
}

export function buildRolDevolucionObservacion(
  rol: RolDevolucionProcesamiento,
): string {
  return `${ROL_DEVOLUCION_PREFIX}${rol}`;
}

export function solicitudTieneSobrantePendiente(
  sobranteKg: string | number | null | undefined,
): boolean {
  const parsed = Number(sobranteKg);
  return Number.isFinite(parsed) && parsed > 0;
}
