import type { OrdenTareaAlmacenPrintData } from "../print/orden-tarea-almacen.types";
import type {
  OrdenSurtidoCapturaPayload,
  OrdenSurtidoChecks,
} from "./orden-surtido.types";
import {
  CABECERA_KEYS,
  CABECERA_LABELS,
  CHECK_KEYS,
} from "./openai-surtido-schema";
import {
  ensureLineasCompletas,
  type LineaRawCaptura,
  remapLineasPorProducto,
} from "./openai-surtido-lineas";
import {
  expandNombresParcialesFirmas,
  sanitizeFacturaAsociada,
  sanitizeFacturaOkFolioFirma,
} from "./openai-surtido-sanitize";

export function buildOriginalSnapshot(original: OrdenTareaAlmacenPrintData): string {
  return JSON.stringify(
    {
      folio: original.folio,
      cliente: original.cliente,
      centroConsumo: original.centroConsumo,
      numeroOrdenCliente: original.numeroOrdenCliente,
      fechaEntrega: original.fechaEntrega,
      horaEntrega: original.horaEntrega,
      direccionEntrega: original.direccionEntrega,
      notasGenerales: original.notasGenerales,
      lineas: original.lineas.map((linea, index) => ({
        indice: index + 1,
        producto: linea.producto,
        especificacionImpresa: linea.especificacion || "(vacío)",
        cantidadSolicitada: linea.cantidadSolicitada,
        cantidadPreparada: "(vacío en original — leer manuscrito)",
        codigoIncidencia: "(vacío — leer A–F si hay)",
        nota: "(vacío — leer manuscrito)",
        alisto: "(checkbox vacío)",
        reviso: "(checkbox vacío)",
      })),
      camposManuscritosEsperados: {
        cabecera: [...CABECERA_KEYS],
        checks: [...CHECK_KEYS],
        porLinea: [
          "especificacion",
          "cantidadPreparada",
          "codigoIncidencia",
          "nota",
          "alisto",
          "reviso",
        ],
      },
    },
    null,
    2,
  );
}

export function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function asNullableBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function asCamposExtra(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!Array.isArray(value)) return out;
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as { etiqueta?: unknown; valor?: unknown };
    const etiqueta =
      typeof row.etiqueta === "string" ? row.etiqueta.trim() : "";
    const valor = typeof row.valor === "string" ? row.valor.trim() : "";
    if (etiqueta && valor) out[etiqueta] = valor;
  }
  return out;
}

export function normalizePayload(
  raw: unknown,
  original: OrdenTareaAlmacenPrintData,
): OrdenSurtidoCapturaPayload {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const cabeceraRaw =
    obj.cabecera && typeof obj.cabecera === "object"
      ? (obj.cabecera as Record<string, unknown>)
      : {};
  const checksRaw =
    obj.checks && typeof obj.checks === "object"
      ? (obj.checks as Record<string, unknown>)
      : {};

  const campos: Record<string, string> = {
    ...asCamposExtra(obj.camposExtra),
    ...asCamposExtra(
      Array.isArray(obj.campos)
        ? obj.campos
        : Object.entries(
            obj.campos && typeof obj.campos === "object"
              ? (obj.campos as Record<string, unknown>)
              : {},
          ).map(([etiqueta, valor]) => ({ etiqueta, valor })),
    ),
  };

  for (const key of CABECERA_KEYS) {
    const valor = asNullableString(cabeceraRaw[key]);
    if (!valor) continue;
    campos[key] = valor;
    campos[CABECERA_LABELS[key]] = valor;
  }

  const cajas15 = campos.cajas15kg || campos["Cajas 1.5 kg"];
  const cajas21 = campos.cajas21kg || campos["Cajas 21 kg"];
  if (cajas15 || cajas21) {
    const combo = [cajas15 || "—", cajas21 || "—"].join(" / ");
    campos["Cajas 1.5 kg / 21 kg"] = combo;
    campos.cajas15kg21kg = combo;
  }

  const checks: OrdenSurtidoChecks = {};
  for (const key of CHECK_KEYS) {
    const valor = asNullableBool(checksRaw[key]);
    if (valor != null) checks[key] = valor;
  }

  const lineasRaw = Array.isArray(obj.lineas) ? obj.lineas : [];
  const lineasParsed: LineaRawCaptura[] = lineasRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const indice = Number(row.indice);
      if (!Number.isFinite(indice) || indice < 1) return null;
      return {
        indice: Math.floor(indice),
        productoImpreso: asNullableString(row.productoImpreso),
        especificacion: null,
        cantidadPreparada: asNullableString(row.cantidadPreparada),
        codigoIncidencia: asNullableString(row.codigoIncidencia),
        nota: asNullableString(row.nota),
        alisto: asNullableBool(row.alisto),
        reviso: asNullableBool(row.reviso),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  const remapped = remapLineasPorProducto(lineasParsed, original);
  const lineas = ensureLineasCompletas(original, remapped);

  const calidadRaw =
    obj.calidadFoto && typeof obj.calidadFoto === "object"
      ? (obj.calidadFoto as Record<string, unknown>)
      : null;
  const calidadFoto = calidadRaw
    ? {
        esHojaSurtido: asNullableBool(calidadRaw.esHojaSurtido) === true,
        hojaCompletaYLegible:
          asNullableBool(calidadRaw.hojaCompletaYLegible) === true,
        motivo: asNullableString(calidadRaw.motivo)?.trim() || "",
      }
    : null;

  const base: OrdenSurtidoCapturaPayload = {
    campos,
    checks,
    lineas,
    observacionesIa: asNullableString(obj.observacionesIa),
    precisionEstimada: null,
    calidadFoto,
  };

  sanitizeFacturaAsociada(base.campos);
  sanitizeFacturaOkFolioFirma(base.campos);
  expandNombresParcialesFirmas(base.campos);
  return base;
}