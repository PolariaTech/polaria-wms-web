import type {
  OrdenSurtidoCapturaPayload,
  OrdenSurtidoChecks,
} from "../surtido/orden-surtido.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

/** Combina el snapshot original con el payload IA para el PDF actualizado. */
export function applySurtidoToPrintData(
  original: OrdenTareaAlmacenPrintData,
  surtido: OrdenSurtidoCapturaPayload,
): OrdenTareaAlmacenPrintData {
  const byIndex = new Map(
    surtido.lineas.map((linea) => [linea.indice, linea] as const),
  );

  return {
    ...original,
    surtido: {
      ...surtido,
      checks: surtido.checks ?? {},
    },
    lineas: original.lineas.map((linea, index) => {
      const filled = byIndex.get(index + 1);
      if (!filled) return linea;
      return {
        ...linea,
        especificacion:
          filled.especificacion?.trim() || linea.especificacion,
        cantidadPreparada: filled.cantidadPreparada ?? undefined,
        codigoIncidencia: filled.codigoIncidencia ?? undefined,
        nota: filled.nota ?? undefined,
        alisto: filled.alisto ?? undefined,
        reviso: filled.reviso ?? undefined,
      };
    }),
  };
}

export function campoSurtido(
  surtido: OrdenSurtidoCapturaPayload | null | undefined,
  ...keys: string[]
): string {
  if (!surtido?.campos) return "";
  for (const key of keys) {
    const direct = surtido.campos[key];
    if (direct?.trim()) return direct.trim();
  }
  const entries = Object.entries(surtido.campos);
  for (const key of keys) {
    const needle = key.toLowerCase();
    const found = entries.find(([k]) => k.toLowerCase().includes(needle));
    if (found?.[1]?.trim()) return found[1].trim();
  }
  return "";
}

export function checkSurtido(
  surtido: OrdenSurtidoCapturaPayload | null | undefined,
  key: keyof OrdenSurtidoChecks,
): boolean {
  return surtido?.checks?.[key] === true;
}
