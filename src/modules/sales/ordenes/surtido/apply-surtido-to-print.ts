import type {
  OrdenSurtidoCapturaPayload,
  OrdenSurtidoChecks,
  OrdenSurtidoLineaCaptura,
} from "../surtido/orden-surtido.types";
import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";

function normalizeLooseText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function textsLooselyEqual(a: string, b: string): boolean {
  const left = normalizeLooseText(a);
  const right = normalizeLooseText(b);
  return Boolean(left) && left === right;
}

/**
 * Incidencias (bloque inferior) ≠ Especificación (columna por producto).
 * Si la IA metió el mismo texto en ambos, no contaminar la columna.
 */
export function resolveEspecificacionLinea(input: {
  impresa: string;
  manuscrita?: string | null;
  incidencias: string;
}): string {
  const printed = input.impresa.trim();
  const handwritten = input.manuscrita?.trim() ?? "";
  if (!handwritten) return printed;

  const incidencias = input.incidencias.trim();
  if (incidencias && textsLooselyEqual(handwritten, incidencias)) {
    return printed;
  }
  if (
    incidencias.length >= 12 &&
    normalizeLooseText(handwritten).includes(normalizeLooseText(incidencias))
  ) {
    return printed;
  }
  return handwritten;
}

/**
 * Descarta incidencias que en realidad son especificación(es) de producto.
 */
export function resolveIncidenciasTexto(input: {
  incidencias: string;
  lineasImpresas: readonly { especificacion: string }[];
  lineasCaptura: readonly OrdenSurtidoLineaCaptura[];
}): string {
  const raw = input.incidencias.trim();
  if (!raw) return "";

  const specs = [
    ...input.lineasImpresas.map((linea) => linea.especificacion.trim()),
    ...input.lineasCaptura.map((linea) => linea.especificacion?.trim() ?? ""),
  ].filter(Boolean);

  if (specs.some((spec) => textsLooselyEqual(raw, spec))) {
    return "";
  }

  const joined = specs.join(" ");
  if (joined && textsLooselyEqual(raw, joined)) {
    return "";
  }

  return raw;
}

/** Combina el snapshot original con el payload IA para el PDF actualizado. */
export function applySurtidoToPrintData(
  original: OrdenTareaAlmacenPrintData,
  surtido: OrdenSurtidoCapturaPayload,
): OrdenTareaAlmacenPrintData {
  const byIndex = new Map(
    surtido.lineas.map((linea) => [linea.indice, linea] as const),
  );

  const incidenciasRaw = campoSurtidoExact(
    surtido,
    "incidencias",
    "Incidencias",
  );

  const lineas = original.lineas.map((linea, index) => {
    const filled = byIndex.get(index + 1);
    if (!filled) return linea;
    return {
      ...linea,
      especificacion: resolveEspecificacionLinea({
        impresa: linea.especificacion,
        manuscrita: filled.especificacion,
        incidencias: incidenciasRaw,
      }),
      cantidadPreparada: filled.cantidadPreparada ?? undefined,
      codigoIncidencia: filled.codigoIncidencia ?? undefined,
      nota: filled.nota ?? undefined,
      alisto: filled.alisto ?? undefined,
      reviso: filled.reviso ?? undefined,
    };
  });

  const incidencias = resolveIncidenciasTexto({
    incidencias: incidenciasRaw,
    lineasImpresas: lineas,
    lineasCaptura: [],
  });

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
        "Orden de compra del cliente",
        "Orden de compra del hotel",
      ) || original.numeroOrdenCliente,
    fechaEntrega:
      campoSurtido(surtido, "fechaEntrega", "Fecha de entrega") ||
      original.fechaEntrega,
    horaEntrega:
      campoSurtido(
        surtido,
        "horaEntrega",
        "Hora de entrega",
        "horaComprometida",
        "Hora comprometida",
      ) || original.horaEntrega,
    direccionEntrega: fillIfEmpty(
      original.direccionEntrega,
      campoSurtido(
        surtido,
        "direccionEntrega",
        "Dirección de entrega",
        "Direccion de entrega",
      ),
    ),
    notasGenerales: original.notasGenerales,
    surtido: {
      ...surtido,
      campos: {
        ...surtido.campos,
        incidencias,
        Incidencias: incidencias,
      },
      checks: surtido.checks ?? {},
    },
    lineas,
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

/** Solo claves exactas (sin includes). Para campos que no deben cruzarse. */
export function campoSurtidoExact(
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
  return "";
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
  // Fuzzy solo si la clave pedida no es incidencias (evita cruces con especificación).
  const askingIncidencias = keys.some(
    (key) => normalizeCampoKey(key) === "incidencias",
  );
  if (askingIncidencias) return "";
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
