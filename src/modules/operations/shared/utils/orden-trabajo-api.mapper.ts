import { parseProcesamientoSolicitudRef } from "@/modules/processing/shared/constants/procesamiento-solicitud-ref";
import type {
  FlujoOrdenTrabajoApi,
  OrdenTrabajoApiRow,
} from "../types/operations-api.types";
import type { TareaColaRow } from "@/modules/processing/shared/types/processing.types";

function readString(
  row: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function parseTipoFlujoFromObservaciones(
  observaciones: string | null | undefined,
): FlujoOrdenTrabajoApi | null {
  if (!observaciones?.trim()) return null;

  const trimmed = observaciones.trim();

  if (trimmed.startsWith("flujo:")) {
    const value = trimmed.slice("flujo:".length).split("|")[0]?.trim();
    if (
      value === "a_bodega" ||
      value === "a_salida" ||
      value === "a_procesamiento" ||
      value === "revisar" ||
      value === "bodega_a_bodega"
    ) {
      return value;
    }
  }

  return null;
}

/** Detecta referencias a OV en textos de OT/tarea (fallback si el API no expone idOrdenVenta). */
export function textoReferenciaOrdenVenta(
  ...values: Array<string | null | undefined>
): boolean {
  for (const value of values) {
    const text = value?.trim();
    if (!text) continue;

    const normalized = text.toLowerCase();
    if (
      normalized.includes("orden de venta") ||
      normalized.includes("orden_venta") ||
      normalized.includes("despacho venta") ||
      normalized.includes("venta ov-")
    ) {
      return true;
    }

    if (/\bov-\d{4}/i.test(text)) {
      return true;
    }
  }

  return false;
}

/** Extrae código OV (ej. OV-20260709-160103) desde textos de OT/tarea. */
export function extractOvCodigoFromText(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const text = value?.trim();
    if (!text) continue;

    const match = text.match(/\b(OV-\d{8}-\d+)\b/i);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

export function mapOrdenTrabajoApiRow(
  raw: Record<string, unknown>,
): OrdenTrabajoApiRow {
  const observaciones = readString(raw, "observaciones");
  const tipoFlujoRaw = readString(raw, "tipoFlujo", "tipo_flujo");

  const tipoFlujo =
    (tipoFlujoRaw as FlujoOrdenTrabajoApi | null) ??
    parseTipoFlujoFromObservaciones(observaciones);

  return {
    idOrdenTrabajo:
      readString(raw, "idOrdenTrabajo", "id_orden_trabajo") ?? "",
    codigoCuenta: readString(raw, "codigoCuenta", "codigo_cuenta") ?? "",
    idBodega: readString(raw, "idBodega", "id_bodega") ?? "",
    codigo: readString(raw, "codigo") ?? "",
    estado: readString(raw, "estado") ?? "",
    tipo: readString(raw, "tipo") ?? "",
    tipoFlujo,
    idAsignado: readString(raw, "idAsignado", "id_asignado"),
    idSolicitante: readString(raw, "idSolicitante", "id_solicitante"),
    idLote: readString(raw, "idLote", "id_lote"),
    idUbicacionOrigen: readString(
      raw,
      "idUbicacionOrigen",
      "id_ubicacion_origen",
    ),
    idUbicacionDestino: readString(
      raw,
      "idUbicacionDestino",
      "id_ubicacion_destino",
    ),
    idOrdenVenta: readString(raw, "idOrdenVenta", "id_orden_venta"),
    observaciones,
    createdAt: readString(raw, "createdAt", "created_at") ?? "",
    updatedAt: readString(raw, "updatedAt", "updated_at") ?? "",
  };
}

export function mapTareaColaApiRow(raw: Record<string, unknown>): TareaColaRow {
  const tipo = readString(raw, "tipo") ?? "despacho";
  const estado = readString(raw, "estado") ?? "pendiente";
  const titulo = readString(raw, "titulo");
  const descripcion = readString(raw, "descripcion");
  const observaciones = readString(raw, "observaciones");

  const idSolicitudExplicito = readString(
    raw,
    "idSolicitudProcesamiento",
    "id_solicitud_procesamiento",
  );

  return {
    id_tarea: readString(raw, "idTarea", "id_tarea") ?? "",
    codigo_cuenta: readString(raw, "codigoCuenta", "codigo_cuenta") ?? "",
    id_bodega: readString(raw, "idBodega", "id_bodega") ?? "",
    tipo: tipo as TareaColaRow["tipo"],
    estado: estado as TareaColaRow["estado"],
    id_asignado: readString(raw, "idAsignado", "id_asignado"),
    id_orden_trabajo: readString(raw, "idOrdenTrabajo", "id_orden_trabajo"),
    id_solicitud_procesamiento:
      idSolicitudExplicito ??
      parseProcesamientoSolicitudRef(titulo, descripcion, observaciones),
    titulo,
    descripcion,
    created_at: readString(raw, "createdAt", "created_at") ?? "",
    updated_at: readString(raw, "updatedAt", "updated_at") ?? "",
  };
}
