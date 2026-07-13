import { DomainServiceError } from "@/lib/utils/domain-service-error";
import { ApiError, apiRequest } from "@/services/api/api";
import type {
  CreateOrdenesPostCierreInput,
  CreateSolicitudProcesamientoInput,
  OrdenesPostCierreResult,
  SolicitudProcesamientoRow,
} from "../types/processing.types";

async function mutateApi<T>(
  path: string,
  method: "POST" | "PATCH",
  body?: unknown,
): Promise<T> {
  try {
    return await apiRequest<T>(path, { method, auth: true, body });
  } catch (error) {
    if (error instanceof ApiError) {
      throw new DomainServiceError(error.message, "MUTATION_FAILED", error);
    }
    throw error;
  }
}

interface SolicitudProcesamientoApiRow {
  idSolicitudProcesamiento: string;
  codigoCuenta: string;
  idBodega: string;
  codigo: string;
  idCliente: string | null;
  idProductoPrimario: string;
  idProductoSecundario: string;
  idSolicitante: string;
  idOperario: string | null;
  idProcesador: string | null;
  estado: string;
  kilosPrimario: string;
  kilosSecundario: string | null;
  kilosMerma: string | null;
  sobranteKg: string | null;
  reglaConversionCantidadPrimario: string | null;
  reglaConversionUnidadesSecundario: string | null;
  perdidaProcesamientoPct: string | null;
  estimadoUnidadesSecundario: string | null;
  kgPrimarioDescontado: string | null;
  cierreDesdeProcesador: boolean;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapSolicitudRow(row: SolicitudProcesamientoApiRow): SolicitudProcesamientoRow {
  return {
    id_solicitud_procesamiento: row.idSolicitudProcesamiento,
    codigo_cuenta: row.codigoCuenta,
    id_bodega: row.idBodega,
    codigo: row.codigo,
    id_cliente: row.idCliente,
    id_producto_primario: row.idProductoPrimario,
    id_producto_secundario: row.idProductoSecundario,
    id_solicitante: row.idSolicitante,
    id_operario: row.idOperario,
    id_procesador: row.idProcesador,
    estado: row.estado as SolicitudProcesamientoRow["estado"],
    kilos_primario: row.kilosPrimario,
    kilos_secundario: row.kilosSecundario,
    kilos_merma: row.kilosMerma,
    sobrante_kg: row.sobranteKg,
    regla_conversion_cantidad_primario: row.reglaConversionCantidadPrimario,
    regla_conversion_unidades_secundario: row.reglaConversionUnidadesSecundario,
    perdida_procesamiento_pct: row.perdidaProcesamientoPct,
    estimado_unidades_secundario: row.estimadoUnidadesSecundario,
    kg_primario_descontado: row.kgPrimarioDescontado,
    cierre_desde_procesador: row.cierreDesdeProcesador,
    observaciones: row.observaciones,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export async function listSolicitudesProcesamientoApi(params: {
  codigoCuenta: string;
  idBodega: string;
  estado?: string;
  idProcesador?: string;
}): Promise<SolicitudProcesamientoRow[]> {
  const qs = new URLSearchParams({
    codigoCuenta: params.codigoCuenta,
    idBodega: params.idBodega,
  });
  if (params.estado) qs.set("estado", params.estado);
  if (params.idProcesador) qs.set("idProcesador", params.idProcesador);

  const rows = await apiRequest<SolicitudProcesamientoApiRow[]>(
    `/procesamiento/solicitudes?${qs.toString()}`,
    { auth: true },
  );

  return rows.map(mapSolicitudRow);
}

export async function getSolicitudProcesamientoApi(
  idSolicitud: string,
): Promise<SolicitudProcesamientoRow> {
  const row = await apiRequest<SolicitudProcesamientoApiRow>(
    `/procesamiento/solicitudes/${encodeURIComponent(idSolicitud)}`,
    { auth: true },
  );
  return mapSolicitudRow(row);
}

export async function getDesperdicioSugeridoApi(
  idSolicitud: string,
): Promise<{ desperdicioKgSugerido: number | null }> {
  return apiRequest<{ desperdicioKgSugerido: number | null }>(
    `/procesamiento/solicitudes/${encodeURIComponent(idSolicitud)}/desperdicio-sugerido`,
    { auth: true },
  );
}

export async function createSolicitudProcesamientoApi(
  input: Omit<CreateSolicitudProcesamientoInput, "idSolicitante"> & {
    idSolicitante?: string;
  },
): Promise<SolicitudProcesamientoRow> {
  const row = await mutateApi<SolicitudProcesamientoApiRow>(
    "/procesamiento/solicitudes",
    "POST",
    {
      codigoCuenta: input.codigoCuenta,
      idBodega: input.idBodega,
      idProductoPrimario: input.idProductoPrimario,
      idProductoSecundario: input.idProductoSecundario,
      kilosPrimario: input.kilosPrimario,
      reglaConversionCantidadPrimario: input.reglaConversionCantidadPrimario,
      reglaConversionUnidadesSecundario:
        input.reglaConversionUnidadesSecundario,
      perdidaProcesamientoPct: input.perdidaProcesamientoPct,
      observaciones: input.observaciones,
    },
  );

  return mapSolicitudRow(row);
}

export async function asignarOperarioProcesamientoApi(
  idSolicitud: string,
  params: { codigoCuenta: string; idBodega: string; idOperario: string },
): Promise<SolicitudProcesamientoRow> {
  const row = await mutateApi<SolicitudProcesamientoApiRow>(
    `/procesamiento/solicitudes/${encodeURIComponent(idSolicitud)}/asignar-operario`,
    "PATCH",
    params,
  );
  return mapSolicitudRow(row);
}

export async function iniciarProcesamientoApi(
  idSolicitud: string,
  params: {
    codigoCuenta: string;
    idBodega: string;
    idProcesador?: string;
  },
): Promise<SolicitudProcesamientoRow> {
  const row = await mutateApi<SolicitudProcesamientoApiRow>(
    `/procesamiento/solicitudes/${encodeURIComponent(idSolicitud)}/iniciar`,
    "POST",
    params,
  );
  return mapSolicitudRow(row);
}

export async function asignarProcesadorApi(
  idSolicitud: string,
  params: { codigoCuenta: string; idBodega: string; idProcesador: string },
): Promise<SolicitudProcesamientoRow> {
  const row = await mutateApi<SolicitudProcesamientoApiRow>(
    `/procesamiento/solicitudes/${encodeURIComponent(idSolicitud)}/asignar-procesador`,
    "PATCH",
    params,
  );
  return mapSolicitudRow(row);
}

export async function cerrarSolicitudProcesamientoApi(
  idSolicitud: string,
  params: {
    codigoCuenta: string;
    idBodega: string;
    kilosMerma: number;
    kilosSecundario?: number;
  },
): Promise<SolicitudProcesamientoRow> {
  const row = await mutateApi<SolicitudProcesamientoApiRow>(
    `/procesamiento/solicitudes/${encodeURIComponent(idSolicitud)}/cerrar`,
    "POST",
    params,
  );
  return mapSolicitudRow(row);
}

export async function crearOrdenesPostCierreApi(
  idSolicitud: string,
  input: CreateOrdenesPostCierreInput,
): Promise<OrdenesPostCierreResult> {
  return mutateApi<OrdenesPostCierreResult>(
    `/procesamiento/solicitudes/${encodeURIComponent(idSolicitud)}/ordenes-post-cierre`,
    "POST",
    input,
  );
}

export async function aplicarOrdenProcesamientoApi(
  idSolicitud: string,
  idOrden: string,
): Promise<{ ok: true }> {
  return mutateApi<{ ok: true }>(
    `/procesamiento/solicitudes/${encodeURIComponent(idSolicitud)}/ordenes/${encodeURIComponent(idOrden)}/aplicar`,
    "POST",
  );
}

export async function terminarSolicitudProcesamientoApi(
  idSolicitud: string,
  params: { codigoCuenta: string; idBodega: string },
): Promise<SolicitudProcesamientoRow> {
  const row = await mutateApi<SolicitudProcesamientoApiRow>(
    `/procesamiento/solicitudes/${encodeURIComponent(idSolicitud)}/terminar`,
    "POST",
    params,
  );
  return mapSolicitudRow(row);
}
