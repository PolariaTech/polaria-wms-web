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
    centroConsumo: fillIfEmpty(
      original.centroConsumo,
      campoSurtido(
        surtido,
        "centroConsumo",
        "Centro de consumo",
        "Centro de consumo / cocina",
      ),
    ),
    numeroOrdenCliente:
      campoSurtido(
        surtido,
        "numeroOrdenCliente",
        "ordenCompraHotel",
        "# de orden del cliente",
        "Orden de compra del hotel",
      ) || original.numeroOrdenCliente,
    fechaEntrega:
      campoSurtido(surtido, "fechaEntrega", "Fecha de entrega") ||
      original.fechaEntrega,
    direccionEntrega: fillIfEmpty(
      original.direccionEntrega,
      campoSurtido(
        surtido,
        "direccionEntrega",
        "Dirección de entrega",
        "Direccion de entrega",
      ),
    ),
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

function normalizeCampoKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function fillIfEmpty(current: string, next: string): string {
  return current.trim() ? current : next;
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
  const entries = Object.entries(surtido.campos).map(
    ([k, v]) => [normalizeCampoKey(k), v] as const,
  );
  for (const key of keys) {
    const needle = normalizeCampoKey(key);
    if (!needle) continue;
    const exact = entries.find(([k, v]) => k === needle && v?.trim());
    if (exact?.[1]?.trim()) return exact[1].trim();
  }
  for (const key of keys) {
    const needle = normalizeCampoKey(key);
    if (!needle) continue;
    const found = entries.find(([k, v]) => k.includes(needle) && v?.trim());
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
